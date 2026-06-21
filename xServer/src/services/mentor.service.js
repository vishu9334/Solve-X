import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import mentorRepository from "../repositorys/implimentations/mongo.mentor.repository.js";
import { generateMCQ, generateEmailContent } from "./AI/AI.service.js";
import redis from "../configs/redis.config.js";
import { Answer } from "../models/Answer.model.js";
import { Attempt } from "../models/assessmentAttempt.model.js";
import { MentorProfile } from "../models/AmentorProfile.model.js";
import { CommonUser } from "../models/AbaseUser.model.js";
import { Skill } from "../models/skill.model.js";
import { AssessmentStore } from "../models/assessmentDataStore.model.js";
import AssessmentEvaluator from "../helpers/AssessmentEvaluator.js";
import activitySessionService from "./SActivitysession.service.js";
import emailQueue from "../queue/email.queue.js";
import { sendNotificationToUser } from '../helpers/socket/socket.helper.js'
import { DoubtSession } from "../models/doubtSession.model.js";

class MentorService {
    async selectSkill(userId, { skillId, skillName }) {
        // 1. Mentor profile exist karti hai?
        const mentorProfile = await mentorRepository.findMentorProfile(userId);
        if (!mentorProfile) throw new ApiError(404, "Mentor profile not found.");

        // 2. Resolve skill — by ID or by Name (find-or-create)
        let skill;

        if (skillId) {
            // Validate if skillId is a valid ObjectId to prevent CastError
            if (!mongoose.Types.ObjectId.isValid(skillId)) {
                throw new ApiError(400, "Invalid skillId format. Must be a 24-character hex string.");
            }
            // Existing skill by ID
            skill = await mentorRepository.findSkillById(skillId);
            if (!skill) throw new ApiError(404, "Skill not found or inactive.");
        } else if (skillName) {
            // Find existing by name (case-insensitive) or create new
            skill = await mentorRepository.findSkillByName(skillName);

            if (!skill) {
                // Create new skill + assessment dynamically
                skill = await mentorRepository.createSkillWithAssessment({
                    name: skillName,
                    createdBy: userId,
                    source: "mentor",
                });
            }
        } else {
            throw new ApiError(400, "Either skillId or skillName is required.");
        }

        // 3. Skill ka assessment linked hai?
        if (!skill.assessmentId) {
            throw new ApiError(400, "No assessment linked to this skill yet.");
        }

        // 4. Pehle se skill select ki hai?
        if (mentorProfile.skillCategory) {
            // Check if they are trying to select a DIFFERENT skill
            if (mentorProfile.skillCategory.toString() !== skill._id.toString()) {
                throw new ApiError(400, "Skill already selected. Pass assessment to change skill.");
            }

            // If selecting the SAME skill, check if they can retry/continue (new test session)
            const attempt = await Attempt.findOne({ userId, assessmentId: skill.assessmentId });
            if (attempt) {
                if (attempt.status === "passed") {
                    throw new ApiError(400, "You have already passed this assessment.");
                }
                if (attempt.attempts.length >= attempt.maxAttempts) {
                    throw new ApiError(400, "No attempts remaining. Verification rejected.");
                }

                // If attempts are remaining, let's generate new questions and update Redis
                const questions = await generateMCQ(skill.name);

                // Conditionally update AssessmentStore durationMinutes and totalQuestions
                const assessmentStore = await AssessmentStore.findById(skill.assessmentId);
                if (assessmentStore) {
                    if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                        assessmentStore.durationMinutes = questions.durationMinutes || 15;
                    }
                    assessmentStore.totalQuestions = questions.questions.length;
                    await assessmentStore.save();
                }

                // Store generated questions in Redis for 1 hour to grade securely
                await redis.set(
                    `assessment:questions:${attempt._id.toString()}`,
                    JSON.stringify(questions.questions),
                    "EX",
                    3600
                );

                return { skill, attempt, questions };
            }
        }

        // 5. MentorProfile mein skill update karo + mentorCount increment
        await mentorRepository.updateMentorSkill(userId, skill._id);
        await mentorRepository.incrementMentorCount(skill._id);

        // 6. Attempt automatically create karo
        const attempt = await mentorRepository.createAttempt(userId, skill.assessmentId);

        // 7. Questions automatically generate karo
        const questions = await generateMCQ(skill.name);

        // 8. Conditionally update AssessmentStore durationMinutes and totalQuestions
        const assessmentStore = await AssessmentStore.findById(skill.assessmentId);
        if (assessmentStore) {
            if (!assessmentStore.durationMinutes || assessmentStore.durationMinutes === 0) {
                assessmentStore.durationMinutes = questions.durationMinutes || 15;
            }
            assessmentStore.totalQuestions = questions.questions.length;
            await assessmentStore.save();
        }

        // Store generated questions in Redis for 1 hour to grade securely
        await redis.set(
            `assessment:questions:${attempt._id.toString()}`,
            JSON.stringify(questions.questions),
            "EX",
            3600
        );

        return { skill, attempt, questions };
    }

    /*
     * This is by mentor examin data submition api.
     */
    async submitAssessment({ userId, attemptId, answers }) {
        if (!userId || !attemptId || !answers) {
            throw new ApiError(400, "All fields are required.");
        }

        // 1. Fetch Attempt and check ownership
        const attempt = await Attempt.findOne({ _id: attemptId, userId }).populate("assessmentId");
        if (!attempt) throw new ApiError(404, "Assessment attempt not found or unauthorized.");

        if (attempt.status === "passed" || attempt.status === "failed") {
            throw new ApiError(400, "Assessment attempt is already completed.");
        }

        // 2. Fetch or Submit the Activity Session (find latest activity session for this user and assessment)
        const { AssessmentActivitySession } = await import("../models/assessmentActivityDataStore.model.js");
        let activitySession = await AssessmentActivitySession.findOne({
            userId,
            assessmentId: attempt.assessmentId._id
        }).sort({ createdAt: -1 });

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

        await Answer.deleteMany({ attemptId });
        await Answer.insertMany(answersToInsert);

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

        await attempt.save();

        // 7. Update MentorProfile
        const mentorProfile = await MentorProfile.findOne({ userId });
        if (mentorProfile) {
            mentorProfile.lastAssessmentAttemptId = attempt._id;
            if (evalResult.isPassed) {
                mentorProfile.isVerifiedMentor = true;
                mentorProfile.verificationStatus = "approved";
                mentorProfile.verifiedAt = new Date();
            } else if (attempt.status === "failed") {
                mentorProfile.verificationStatus = "rejected";
                mentorProfile.rejectedAt = new Date();
                mentorProfile.rejectionReason = "Assessment failed: max attempts reached.";

                if (mentorProfile.skillCategory) {
                    await mentorRepository.decrementAndCleanup(mentorProfile.skillCategory);
                }
            }
            await mentorProfile.save();
        }

        // 8. Generate and Send Result Email via Queue
        const user = await CommonUser.findById(userId);
        console.log("[EMAIL-DEBUG] user found:", user ? user.email : "NULL — user not found!");
        if (user) {
            const skill = await Skill.findOne({ assessmentId: attempt.assessmentId._id });
            console.log("[EMAIL-DEBUG] skill found:", skill ? skill.name : "NULL — skill not found!");
            const emailType = evalResult.isPassed ? "pass" : "fail";
            console.log("[EMAIL-DEBUG] emailType:", emailType, "| score:", evalResult.score);

            try {
                console.log("[EMAIL-DEBUG] Calling generateEmailContent...");
                const emailContent = await generateEmailContent({
                    type: emailType,
                    userName: user.name,
                    score: evalResult.score,
                    skillName: skill?.name || "Selected Skill",
                    reason: ""
                });
                console.log("[EMAIL-DEBUG] emailContent generated:", emailContent?.subject);

                await emailQueue.add("send-result-email", {
                    email: user.email,
                    subject: emailContent.subject,
                    body: emailContent.body
                });
                console.log("[EMAIL-DEBUG] Email job added to queue for:", user.email);
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
        const attempt = await Attempt.findOne({ userId, assessmentId: activitySession.assessmentId });
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

        await attempt.save();

        // Update MentorProfile
        const mentorProfile = await MentorProfile.findOne({ userId });
        if (mentorProfile) {
            mentorProfile.lastAssessmentAttemptId = attempt._id;
            if (attempt.status === "failed") {
                mentorProfile.verificationStatus = "rejected";
                mentorProfile.rejectedAt = new Date();
                mentorProfile.rejectionReason = "Assessment failed: suspicious activity and max attempts reached.";

                if (mentorProfile.skillCategory) {
                    await mentorRepository.decrementAndCleanup(mentorProfile.skillCategory);
                }
            }
            await mentorProfile.save();
        }

        // Generate and Send auto-submit warning/fail email via Queue
        const user = await CommonUser.findById(userId);
        if (user) {
            const skill = await Skill.findOne({ assessmentId: attempt.assessmentId });

            try {
                const emailContent = await generateEmailContent({
                    type: "auto_submit",
                    userName: user.name,
                    score: evalResult.score,
                    skillName: skill?.name || "Selected Skill",
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
        const mentor = await CommonUser.findById(userId);
        if (!mentor) throw new ApiError(404, "User not found.");
        if (mentor.role !== "mentor") {
            throw new ApiError(403, "Access denied. Only mentors can reply to doubts.");
        }

        // Check if mentor is verified
        const mentorProfile = await MentorProfile.findOne({ userId });
        if (!mentorProfile || !mentorProfile.isVerifiedMentor) {
            throw new ApiError(403, "Access denied. Only verified mentors can reply to doubts.");
        }

        // Check if mentor already has an active doubt session
        const activeSession = await DoubtSession.findOne({
            selectedMentorId: userId,
            status: "in_session"
        });
        if (activeSession) {
            throw new ApiError(400, "You already have an active doubt session. Please complete or cancel it first.");
        }

        // Validate doubt session exists and is open
        const doubtSession = await DoubtSession.findOne({
            _id: doubtSessionId,
            status: "open"
        });
        if (!doubtSession) throw new ApiError(404, "Doubt session not found or already closed.");

        // Check if doubt session skill matches mentor skill
        if (!mentorProfile.skillCategory || mentorProfile.skillCategory.toString() !== doubtSession.skillId.toString()) {
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
        await doubtSession.save();

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
        const data = await mentorRepository.mentorDashboardFetch(userId);
        if (!data) throw new ApiError(404, "Mentor dashboard data not found.");
        return data;
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
}

const mentorService = new MentorService();
export default mentorService;