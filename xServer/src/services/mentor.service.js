import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import mentorRepository from "../repositorys/implimentations/mongo.mentor.repository.js";
import { generateMCQ, generateEmailContent, classifyAndNormalizeSkill } from "./AI/AI.service.js";
import redis from "../configs/redis.config.js";
import AssessmentEvaluator from "../helpers/AssessmentEvaluator.js";
import activitySessionService from "./SActivitysession.service.js";
import emailQueue from "../queue/email.queue.js";
import { sendNotificationToUser } from '../helpers/socket/socket.helper.js'
import { cleanExpiredSessions } from "../helpers/sessionCleanup.helper.js";

class MentorService {
    async selectSpecialization(userId, { specializationId, specializationName }) {
        // 1. Mentor profile exist karti hai?
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (!mentorProfile) throw new ApiError(404, "We couldn't find your mentor profile. Please try logging out and logging back in.");

        // 2. Resolve specialization — by ID or by Name (find-or-create)
        let specialized;

        if (specializationId) {
            // Validate if specializationId is a valid ObjectId to prevent CastError
            if (!mongoose.Types.ObjectId.isValid(specializationId)) {
                throw new ApiError(400, "Something went wrong with the selected skill. Please go back and try selecting it again.");
            }
            // Existing specialization by ID
            specialized = await mentorRepository.findSpecializedById(specializationId);
            if (!specialized) throw new ApiError(404, "The selected skill is no longer available. Please go back and choose a different one.");
        } else if (specializationName) {
            // AI-driven classification and synonym resolution
            // 1. Fetch all existing specializations and catalogs
            const existingData = await mentorRepository.getAllSpecializationsAndCatalogs();

            // 2. Call AI classification to check synonyms and main categories
            const classification = await classifyAndNormalizeSkill(specializationName, existingData);

            if (classification.isMatch && classification.matchedSpecializationId) {
                // Synonym match found! E.g. "reactjs" matched to "React JS"
                specialized = await mentorRepository.findSpecializedById(classification.matchedSpecializationId);
            }

            if (!specialized) {
                // E.g. input "Vue JS" or "Anatomy" is a new skill
                const normalizedName = classification.normalizedSpecializationName;

                // Check if it already exists by exact normalized name to avoid duplicate creations
                specialized = await mentorRepository.findSpecializedByName(normalizedName);

                if (!specialized) {
                    // Create new specialization + assessment dynamically
                    specialized = await mentorRepository.createSpecializedWithAssessment({
                        name: normalizedName,
                        createdBy: userId,
                        source: "mentor",
                    });
                }
            }

            // Link the specialization to the correct Catalog (Main Category)
            const mainCategory = classification.mainCategory;
            const existingCatalog = await mentorRepository.findCatalogByName(mainCategory);
            if (existingCatalog) {
                // Add to existing catalog (Main Category)
                await mentorRepository.specializationOfRepositoryUpdate(specialized._id, existingCatalog.name);
            } else {
                // Create a new catalog (Main Category) and add this specialization to it
                await mentorRepository.specializationOfNewCreateOne({
                    specializationName: mainCategory,
                    specializationId: specialized._id
                });
            }
        } else {
            throw new ApiError(400, "Please select a skill from the list or type a custom skill name to proceed.");
        }

        // 3. Specialization ka assessment linked hai?
        if (!specialized.assessmentId) {
            const assessment = await mentorRepository.createAssessmentForSpecialization(specialized._id, userId, specialized.name);
            specialized.assessmentId = assessment._id;
        }

        // 4. Pehle se specialization select ki hai?
        if (mentorProfile.specializedCategory) {
            const isSameSpecialization = mentorProfile.specializedCategory.toString() === specialized._id.toString();

            if (!isSameSpecialization) {
                // ── USER IS SWITCHING TO A DIFFERENT SPECIALIZATION ──────────────
                // Find old attempt to count how many attempts were already used (global limit = 3)
                const oldSpecialized = await mentorRepository.findSpecializedById(mentorProfile.specializedCategory);
                let usedAttempts = 0;

                if (oldSpecialized?.assessmentId) {
                    const oldAttempt = await mentorRepository.findAttemptByAssessment(userId, oldSpecialized.assessmentId);
                    if (oldAttempt) {
                        usedAttempts = oldAttempt.attempts.length;
                    }
                }

                const GLOBAL_MAX = 3;
                const remainingAttempts = GLOBAL_MAX - usedAttempts;

                // Check cooldown if no attempts remaining
                if (remainingAttempts <= 0) {
                    const cooldownUntil = mentorProfile?.cooldownUntil;
                    const now = new Date();

                    if (cooldownUntil && now < new Date(cooldownUntil)) {
                        const msLeft = new Date(cooldownUntil) - now;
                        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
                        const daysLeft = Math.floor(hoursLeft / 24);
                        const remainingHours = hoursLeft % 24;
                        const timeMsg = daysLeft > 0
                            ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} ${remainingHours > 0 ? `and ${remainingHours} hour${remainingHours > 1 ? "s" : ""}` : ""}`
                            : `${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}`;

                        throw new ApiError(429,
                            `⏳ You've used all 3 attempts across your assessments. You can try a new specialization after ${timeMsg}. Use this time to prepare well!`,
                            { cooldownUntil: cooldownUntil.toISOString(), hoursRemaining: hoursLeft }
                        );
                    }

                    // Cooldown expired — let them switch with fresh attempts
                    // (fall through to switch logic below with remainingAttempts = 3)
                }

                const effectiveMaxAttempts = remainingAttempts > 0 ? remainingAttempts : GLOBAL_MAX;

                // Decrement mentorCount on OLD specialization
                await mentorRepository.decrementAndCleanup(mentorProfile.specializedCategory);

                // Update mentorProfile to new specialization
                await mentorRepository.updateMentorSkill(userId, specialized._id);
                await mentorRepository.incrementMentorCount(specialized._id);

                // Clear any cooldown on the profile (fresh start on new spec)
                mentorProfile.cooldownUntil = null;
                mentorProfile.verificationStatus = "in_progress";
                mentorProfile.rejectionReason = null;
                await mentorRepository.saveMentorProfile(mentorProfile);

                // Create a new attempt for the new specialization with remaining attempts
                const newAttempt = await mentorRepository.createAttemptWithMax(
                    userId,
                    specialized.assessmentId,
                    effectiveMaxAttempts
                );

                // Generate fresh questions
                const questions = await generateMCQ(specialized.name);

                // Update AssessmentStore
                const assessmentStore = await mentorRepository.findAssessmentStoreById(specialized.assessmentId);
                if (assessmentStore) {
                    const updateData = { totalQuestions: questions.questions.length };
                    if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                        updateData.durationMinutes = questions.durationMinutes || 15;
                    }
                    await mentorRepository.updateAssessmentStore(specialized.assessmentId, updateData);
                }

                // Cache questions in Redis
                await redis.set(
                    `assessment:questions:${newAttempt._id.toString()}`,
                    JSON.stringify(questions.questions),
                    "EX",
                    3600
                );

                return {
                    specialized,
                    attempt: newAttempt,
                    questions,
                    switched: true,
                    remainingAttempts: effectiveMaxAttempts,
                };
            }

            // ── SAME SPECIALIZATION — retry/continue flow ──────────────────────
            const attempt = await mentorRepository.findAttemptByAssessment(userId, specialized.assessmentId);
            if (attempt) {
                if (attempt.status === "passed") {
                    throw new ApiError(400, "🎉 You have already passed the assessment for this skill! Your profile is verified — no need to retake it.");
                }

                if (attempt.attempts.length >= attempt.maxAttempts) {
                    // All attempts used — check cooldown
                    const mentorProfileCheck = await mentorRepository.findMentorProfile(userId);
                    const cooldownUntil = mentorProfileCheck?.cooldownUntil;
                    const now = new Date();

                    if (cooldownUntil && now < new Date(cooldownUntil)) {
                        const msLeft = new Date(cooldownUntil) - now;
                        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
                        const daysLeft = Math.floor(hoursLeft / 24);
                        const remainingHours = hoursLeft % 24;

                        const timeMsg = daysLeft > 0
                            ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} ${remainingHours > 0 ? `and ${remainingHours} hour${remainingHours > 1 ? "s" : ""}` : ""}`
                            : `${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}`;

                        throw new ApiError(429, `Cooldown active. You can retry after ${timeMsg}. Use this time to prepare!`, {
                            cooldownUntil: cooldownUntil.toISOString(),
                            hoursRemaining: hoursLeft,
                        });
                    }

                    // ✅ Cooldown expired — reset attempt for a fresh start
                    attempt.attempts = [];
                    attempt.status = "pending";
                    await mentorRepository.saveAttempt(attempt);

                    // Clear cooldown on mentor profile
                    if (mentorProfileCheck) {
                        mentorProfileCheck.cooldownUntil = null;
                        mentorProfileCheck.verificationStatus = "in_progress";
                        mentorProfileCheck.rejectionReason = null;
                        await mentorRepository.saveMentorProfile(mentorProfileCheck);
                    }

                    // Re-add mentor count (was decremented on fail)
                    await mentorRepository.incrementMentorCount(specialized._id);
                }

                // Generate fresh questions for retry
                const questions = await generateMCQ(specialized.name);

                // Update AssessmentStore
                const assessmentStore = await mentorRepository.findAssessmentStoreById(specialized.assessmentId);
                if (assessmentStore) {
                    const updateData = { totalQuestions: questions.questions.length };
                    if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                        updateData.durationMinutes = questions.durationMinutes || 15;
                    }
                    await mentorRepository.updateAssessmentStore(specialized.assessmentId, updateData);
                }

                // Cache questions in Redis for 1 hour
                await redis.set(
                    `assessment:questions:${attempt._id.toString()}`,
                    JSON.stringify(questions.questions),
                    "EX",
                    3600
                );

                return { specialized, attempt, questions };
            }

        }

        // 5. MentorProfile mein skill update karo + mentorCount increment
        await mentorRepository.updateMentorSkill(userId, specialized._id);
        await mentorRepository.incrementMentorCount(specialized._id);

        // 6. Attempt automatically create karo
        const attempt = await mentorRepository.createAttempt(userId, specialized.assessmentId);

        // 7. Questions automatically generate karo
        const questions = await generateMCQ(specialized.name);

        // 8. Conditionally update AssessmentStore durationMinutes and totalQuestions
        const assessmentStore = await mentorRepository.findAssessmentStoreById(specialized.assessmentId);
        if (assessmentStore) {
            const updateData = { totalQuestions: questions.questions.length };
            if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                updateData.durationMinutes = questions.durationMinutes || 15;
            }
            await mentorRepository.updateAssessmentStore(specialized.assessmentId, updateData);
        }

        // Store generated questions in Redis for 1 hour to grade securely
        await redis.set(
            `assessment:questions:${attempt._id.toString()}`,
            JSON.stringify(questions.questions),
            "EX",
            3600
        );

        return { specialized, attempt, questions };
    }

    /*
     * This is by mentor examin data submition api.
     */
    async submitAssessment({ userId, attemptId, answers }) {
        if (!userId || !attemptId || !answers) {
            throw new ApiError(400, "All fields are required.");
        }

        // 1. Fetch Attempt and check ownership
        const attempt = await mentorRepository.findAttemptWithAssessment(attemptId, userId);
        if (!attempt) throw new ApiError(404, "Assessment attempt not found or unauthorized.");

        if (attempt.status === "passed" || attempt.status === "failed") {
            throw new ApiError(400, "This assessment has already been submitted. Please go to your dashboard to see your result.");
        }

        // 2. Fetch or Submit the Activity Session (find latest activity session for this user and assessment)
        let activitySession = await mentorRepository.findLatestActivitySession(userId, attempt.assessmentId._id);

        if (!activitySession) throw new ApiError(404, "Activity session not found.");
        const sessionId = activitySession._id;

        const { default: ActivitySessionDomain } = await import("../domain/DActivitysession.domain.js");
        const domainSession = new ActivitySessionDomain(activitySession);

        if (!domainSession.isEnded()) {
            const elapsedMs = new Date() - new Date(activitySession.startedAt);
            const elapsedMinutes = elapsedMs / (1000 * 60);
            const limitMinutes = attempt.assessmentId?.durationMinutes || 15;

            if (elapsedMinutes > limitMinutes) {
                activitySession = await activitySessionService.submitWindowSession(sessionId, userId, {
                    eventType: "TIME_EXPIRED",
                    message: "Time limit expired",
                    metadata: { timeExpired: true }
                });
            } else {
                activitySession = await activitySessionService.submitWindowSession(sessionId, userId, {
                    message: "Normal submission"
                });
            }
        }

        // 3. Retrieve correct answers cached in Redis
        const cachedQuestionsStr = await redis.get(`assessment:questions:${attemptId}`);
        if (!cachedQuestionsStr) {
            const remaining = attempt.maxAttempts - attempt.attempts.length;
            throw new ApiError(400, `Assessment session has expired. Please select the skill again to start a new attempt. You have ${remaining} attempts remaining.`);
        }

        let correctAnswersMap = new Map();
        const cachedQuestions = JSON.parse(cachedQuestionsStr);
        cachedQuestions.forEach((q) => {
            correctAnswersMap.set(q.questionText, q.correctAnswer);
        });

        // 4. Save and grade candidate answers
        const answersToInsert = answers.map((ans) => {
            const correctAnswer = correctAnswersMap.get(ans.questionId) || "";
            const isCorrect = ans.selectedAnswer === correctAnswer;

            return {
                userId,
                attemptId,
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                isCorrect
            };
        });

        await mentorRepository.saveAnswers(attemptId, answersToInsert);

        // 5. Evaluate the attempt using AssessmentEvaluator
        const evalResult = await AssessmentEvaluator.evaluate(attempt, activitySession);

        // 6. Update Attempt document
        attempt.attempts.push({
            sessionId: activitySession._id,
            score: evalResult.score,
            isPassed: evalResult.isPassed,
            attemptedAt: new Date()
        });

        if (evalResult.isPassed) {
            attempt.status = "passed";
        } else {
            if (attempt.attempts.length >= attempt.maxAttempts) {
                attempt.status = "failed";
            } else {
                attempt.status = "in_progress";
            }
        }

        await mentorRepository.saveAttempt(attempt);

        // 7. Fetch specialization (needed for catalog update + email)
        const specialized = await mentorRepository.findSpecializedByAssessmentId(attempt.assessmentId._id);

        // 8. Update MentorProfile
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (mentorProfile) {
            mentorProfile.lastAssessmentAttemptId = attempt._id;
            if (evalResult.isPassed) {
                mentorProfile.isVerifiedMentor = true;
                // Add specialized._id to SpecializationCatalog
                await this.afterPassAssessmentAddSpecialistId({ specializationId: specialized._id, specializationName: specialized.name });
                mentorProfile.verificationStatus = "approved";
                mentorProfile.verifiedAt = new Date();
            } else if (attempt.status === "failed") {
                // Instead of permanent rejection, set a 2-day cooldown.
                // After cooldown expires, mentor can retry with fresh attempts.
                const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours
                mentorProfile.verificationStatus = "in_progress";
                mentorProfile.cooldownUntil = new Date(Date.now() + COOLDOWN_MS);
                mentorProfile.rejectedAt = new Date();
                mentorProfile.rejectionReason = "Assessment failed: all 3 attempts used. Try again after 2 days.";

                if (mentorProfile.specializedCategory) {
                    await mentorRepository.decrementAndCleanup(mentorProfile.specializedCategory);
                }
            }
            await mentorRepository.saveMentorProfile(mentorProfile);
        }


        // 9. Generate and Send Result Email via Queue
        const user = await mentorRepository.findUserById(userId);
        if (user) {
            const emailType = evalResult.isPassed ? "pass" : "fail";

            try {
                const emailContent = await generateEmailContent({
                    type: emailType,
                    userName: user.name,
                    score: evalResult.score,
                    specializationName: specialized?.name || "Selected Specialization",
                    reason: ""
                });

                await emailQueue.add("send-result-email", {
                    email: user.email,
                    subject: emailContent.subject,
                    body: emailContent.body
                });
            } catch (err) {
                console.error("[EMAIL-DEBUG] Failed to generate/send result email:", err.message);
            }
        }

        // 9. Clean up Redis cache for questions
        await redis.del(`assessment:questions:${attemptId}`);

        return {
            attemptStatus: attempt.status,
            evaluation: evalResult
        };
    }

    async handleAutoSubmit(userId, sessionId, activitySession) {
        // Find the attempt matching this user and assessmentId
        const attempt = await mentorRepository.findAttemptByAssessment(userId, activitySession.assessmentId);
        if (!attempt) return;

        if (attempt.status === "passed" || attempt.status === "failed") {
            return; // Already finalized
        }

        // Evaluate the attempt using AssessmentEvaluator
        const evalResult = await AssessmentEvaluator.evaluate(attempt, activitySession);

        // Update Attempt document
        attempt.attempts.push({
            sessionId: activitySession._id,
            score: evalResult.score,
            isPassed: evalResult.isPassed, // Will be false since proctoring failed
            attemptedAt: new Date()
        });

        if (attempt.attempts.length >= attempt.maxAttempts) {
            attempt.status = "failed";
        } else {
            attempt.status = "in_progress";
        }

        await mentorRepository.saveAttempt(attempt);

        // Update MentorProfile
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (mentorProfile) {
            mentorProfile.lastAssessmentAttemptId = attempt._id;
            if (attempt.status === "failed") {
                // 2-day cooldown — same as normal fail
                const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000;
                mentorProfile.verificationStatus = "in_progress";
                mentorProfile.cooldownUntil = new Date(Date.now() + COOLDOWN_MS);
                mentorProfile.rejectedAt = new Date();
                mentorProfile.rejectionReason = "Assessment failed: suspicious activity and all attempts used. Try again after 2 days.";

                if (mentorProfile.specializedCategory) {
                    await mentorRepository.decrementAndCleanup(mentorProfile.specializedCategory);
                }
            }
            await mentorRepository.saveMentorProfile(mentorProfile);
        }

        // Generate and Send auto-submit warning/fail email via Queue
        const user = await mentorRepository.findUserById(userId);
        if (user) {
            const specialized = await mentorRepository.findSpecializedByAssessmentId(attempt.assessmentId);

            try {
                const emailContent = await generateEmailContent({
                    type: "auto_submit",
                    userName: user.name,
                    score: evalResult.score,
                    specializationName: specialized?.name || "Selected Specialization",
                    reason: activitySession.activityRejectReason || "suspicious behavior detected by proctoring system"
                });

                await emailQueue.add("send-result-email", {
                    email: user.email,
                    subject: emailContent.subject,
                    body: emailContent.body
                });
            } catch (err) {
                console.error("Failed to generate/send auto-submit email:", err);
            }
        }

        // Clean up Redis cache for questions
        await redis.del(`assessment:questions:${attempt._id.toString()}`);
    }

    /**
     * Mentor sends a price/time offer for a student's doubt session
     */
    async replyToStudentDoubt(userId, { doubtSessionId, price, availableTime }) {
        if (!mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Invalid doubt session ID");

        // Fetch mentor's details and check role
        const mentor = await mentorRepository.findUserById(userId);
        if (!mentor) throw new ApiError(404, "User not found.");
        if (mentor.role !== "mentor") {
            throw new ApiError(403, "Access denied. Only mentors can reply to doubts.");
        }

        // Check if mentor is verified
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (!mentorProfile || !mentorProfile.isVerifiedMentor) {
            throw new ApiError(403, "Access denied. Only verified mentors can reply to doubts.");
        }

        // Check if mentor already has an active doubt session
        const activeSession = await mentorRepository.findActiveSessionForMentor(userId);
        if (activeSession) {
            throw new ApiError(400, "You already have an active doubt session. Please complete or cancel it first.");
        }

        // Validate doubt session exists and is open
        const doubtSession = await mentorRepository.findOpenDoubtSession(doubtSessionId);
        if (!doubtSession) throw new ApiError(404, "Doubt session not found or already closed.");

        // Check if doubt session skill matches mentor skill
        if (!mentorProfile.specializedCategory || mentorProfile.specializedCategory.toString() !== doubtSession.specializedId.toString()) {
            throw new ApiError(403, "Access denied. You can only reply to doubts matching your selected skill.");
        }

        // Check if mentor already sent an offer
        const alreadyOffered = doubtSession.mentorOffers.find(
            offer => offer.mentorId.toString() === userId.toString()
        );
        if (alreadyOffered) throw new ApiError(400, "You have already sent an offer for this doubt.");

        const offerPrice = price; 

        // Push mentor offer into DoubtSession
        doubtSession.mentorOffers.push({
            mentorId: userId,
            mentorName: mentor.name,
            price: offerPrice,
            availableTime,
            offeredAt: new Date()
        });
        await mentorRepository.saveDoubtSession(doubtSession);

        // Notify student that a new mentor offer arrived
        sendNotificationToUser(doubtSession.studentId, "mentor_offer_received", {
            doubtSessionId: doubtSession._id,
            mentorId: userId,
            mentorName: mentor.name,
            mentorAvatar: mentor.avatar,
            price: offerPrice,
            availableTime
        });

        return {
            message: "Offer sent to student successfully.",
            doubtSessionId: doubtSession._id
        };
    }

    /**
     * Get active assessment attempt details (used to resume assessment test page)
     */
    async getActiveAssessment(userId) {
        if (!userId) throw new ApiError(400, "User ID is required.");
        
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (!mentorProfile || !mentorProfile.specializedCategory) {
            return null;
        }

        const specialized = await mentorRepository.findSpecializedById(mentorProfile.specializedCategory);
        if (!specialized || !specialized.assessmentId) {
            return null;
        }

        const attempt = await mentorRepository.findAttemptByAssessment(userId, specialized.assessmentId);
        if (!attempt || attempt.status === "passed" || attempt.status === "failed") {
            return null;
        }

        // Get cached questions
        const cachedQuestionsStr = await redis.get(`assessment:questions:${attempt._id.toString()}`);
        let questionsList = [];
        let durationMinutes = 15;

        if (cachedQuestionsStr) {
            questionsList = JSON.parse(cachedQuestionsStr);
            const assessmentStore = await mentorRepository.findAssessmentStoreById(specialized.assessmentId);
            durationMinutes = assessmentStore?.durationMinutes || 15;
        } else {
            // Expired or missing, regenerate
            const questions = await generateMCQ(specialized.name);
            questionsList = questions.questions;
            durationMinutes = questions.durationMinutes || 15;

            // Cache questions in Redis for 1 hour
            await redis.set(
                `assessment:questions:${attempt._id.toString()}`,
                JSON.stringify(questionsList),
                "EX",
                3600
            );

            // Update AssessmentStore
            const assessmentStore = await mentorRepository.findAssessmentStoreById(specialized.assessmentId);
            if (assessmentStore) {
                const updateData = { totalQuestions: questionsList.length };
                if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                    updateData.durationMinutes = durationMinutes;
                }
                await mentorRepository.updateAssessmentStore(specialized.assessmentId, updateData);
            }
        }

        // Calculate remaining attempts
        const GLOBAL_MAX = 3;
        const usedAttempts = attempt.attempts.length;
        const remainingAttempts = GLOBAL_MAX - usedAttempts;

        return {
            specialized,
            attempt,
            questions: {
                questions: questionsList,
                durationMinutes
            },
            remainingAttempts
        };
    }

    /**
     * Mentor profile data 
     */
    async mentorProfile(userId) {
        if (!userId) throw new ApiError(404, "Mentor profile not found");
        const data = await mentorRepository.mentorProfileFetch(userId);
        if (!data) throw new ApiError(400, "Unauthorized credential");
        return data;
    }

    /**
     * Get mentor dashboard details (profile + stats + opportunities + sessions)
     */
    async getMentorDashboard(userId) {
        if (!userId) throw new ApiError(400, "User ID is required.");

        // Clean up any expired active sessions first
        await cleanExpiredSessions();

        const user = await mentorRepository.findUserById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "mentor") {
            throw new ApiError(403, "Access denied. Only mentors can access the mentor dashboard.");
        }

        const data = await mentorRepository.mentorDashboardFetch(userId);
        if (!data) throw new ApiError(404, "Mentor dashboard data not found.");

        // Calculate profile completion percentage
        let completion = 40; // 20% name + 20% email are guaranteed
        if (user.avatar && !user.avatar.includes("blank-profile-picture")) completion += 20;

        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (mentorProfile) {
            if (mentorProfile.socialLinks && mentorProfile.socialLinks.length > 0) completion += 20;
        }

        if (data.profile.specialization && data.profile.specialization.description) completion += 20;

        // Calculate active bids count
        const activeBidsCount = await mentorRepository.countActiveBids(userId);

        if (data.stats) {
            data.stats = {
                ...data.stats,
                activeBidsCount,
                profileCompletion: completion
            };
        } else {
            data.stats = {
                totalResolved: 0,
                totalEarnings: 0,
                hasActiveSession: false,
                activeBidsCount,
                profileCompletion: completion
            };
        }

        return data;
    }

    /**
     * Update mentor profile (socialLinks, etc.)
     */
    async updateMentorProfile(userId, updateData) {
        if (!userId) throw new ApiError(400, "Credential not found");
        const cleanUpdateData = {};
        const allowedKeys = ["socialLinks", "jobTitle", "company", "experienceYears", "education", "certifications", "timezone", "preferredLanguage", "payoutDetails"];
        allowedKeys.forEach(key => {
            if (updateData[key] !== undefined) {
                cleanUpdateData[key] = updateData[key];
            }
        });

        const updated = await mentorRepository.updateMentorProfile(userId, cleanUpdateData);
        if (!updated) throw new ApiError(404, "Mentor profile not found.");
        return updated;
    }

    /**
     * Update mentor's skill description
     */
    async updateMentorDescription(userId, description) {
        if (!userId) throw new ApiError(400, "Credential not found");
        const updated = await mentorRepository.updateMentorDescription(userId, description);
        if (!updated) throw new ApiError(404, "No skill assigned to this mentor profile.");
        return updated;
    }
    async afterPassAssessmentAddSpecialistId({specializationId, specializationName}){
        if(!specializationId) throw new ApiError(400, "Credential not found");
        if(!specializationName) throw new ApiError(400, "Required specialization.");
        const existingCatalog = await mentorRepository.specializationOfRepository(specializationId, specializationName);
        if(existingCatalog){
         return await mentorRepository.specializationOfRepositoryUpdate(specializationId,specializationName)
        }else{
          return  await mentorRepository.specializationOfNewCreateOne({ specializationId, specializationName })
        }
    }
}

const mentorService = new MentorService();
export default mentorService;