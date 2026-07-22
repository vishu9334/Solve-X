import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import redis from "../configs/redis.config.js"
import studentRepository from '../repositorys/implimentations/mongo.student.repository.js'
import { sendNotificationToMultipleUsers, sendNotificationToUser, createChatRoom, destroyChatRoom } from "../helpers/socket/socket.helper.js"
import { MentorProfile } from "../models/AmentorProfile.model.js"
import { triggerMentorIgnoreWarning } from "../helpers/mentorWarning.helper.js"
import { cleanExpiredSessions } from "../helpers/sessionCleanup.helper.js"
import mailService from "../services/MailService.js"

class studentService {

    /**
     * Student posts a doubt — creates DoubtSession + notifies all verified mentors of that skill
     */
    specializationMatchingByStudent = async (userId, specializationIdentifier, selectSessionTime, typeWriteQuestion, sessionType = "instant", scheduledTime = null) => {
        if (!mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(401, "Student id's not valid")
        if (!mongoose.Types.ObjectId.isValid(specializationIdentifier))
            throw new ApiError(401, "Specialization id's not valid")

        const isExisted = await studentRepository.findStudentId(userId)
        if (!isExisted) throw new ApiError(404, "Unauthorized student!")
        if (isExisted.role !== "student") {
            throw new ApiError(403, "Access denied. Only students can post doubts.");
        }

        if (!specializationIdentifier || !selectSessionTime || !typeWriteQuestion)
            throw new ApiError(400, "These all are required fields.");

        // Clean up any expired active sessions first
        await cleanExpiredSessions();

        // Check if student already has an active doubt session
        const activeSession = await studentRepository.findActiveSessionForStudent(userId);
        if (activeSession) {
            throw new ApiError(400, "You already have an active doubt session. Please complete or cancel it first.");
        }

        const isSpecializationExisted = await studentRepository.findSpecializationIdentifier(specializationIdentifier);
        if (!isSpecializationExisted) throw new ApiError(404, "This specialization is not available currently.");

        const mentors = await studentRepository.findMentorBySpecialization(isSpecializationExisted._id);
        if (!mentors || mentors.length === 0) {
            throw new ApiError(404, "No mentors are currently available for this specialization.");
        }

        // Create DoubtSession in DB
        const doubtSession = await studentRepository.createDoubtSession({
            studentId: userId,
            specializedId: isSpecializationExisted._id,
            question: typeWriteQuestion,
            sessionDuration: selectSessionTime,
            sessionType,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            status: "open"
        });

        // Notify all matched mentors
        const notificationPayload = {
            doubtSessionId: doubtSession._id,
            studentName: isExisted.name,
            question: typeWriteQuestion,
            specializationName: isSpecializationExisted.name,
            sessionDuration: selectSessionTime,
            sessionType,
            scheduledTime
        };

        const mentorUserIds = mentors
            .filter(mentor => mentor && mentor.userId)
            .map(mentor => mentor.userId._id);
        sendNotificationToMultipleUsers(
            mentorUserIds,
            "student_asked_question",
            notificationPayload
        );

        // Set 10-minute expiry for mentor offers only if it is an instant doubt
        if (sessionType !== "scheduled") {
            setTimeout(async () => {
                const session = await studentRepository.findDoubtSessionById(doubtSession._id);
                if (session && session.status === "open") {
                    session.status = "expired";
                    await studentRepository.saveDoubtSession(session);

                    // Notify student that no mentor responded in time
                    await sendNotificationToUser(userId, "doubt_expired", {
                        doubtSessionId: doubtSession._id,
                        message: "No mentor responded within 10 minutes. Please try again."
                    });

                    // ── Track mentor ignore counts ────────────────────────────────
                    // Find which mentors received the notification but did NOT offer
                    const respondedMentorIds = session.mentorOffers.map(o => o.mentorId.toString());
                    const ignoredMentorIds = mentorUserIds.filter(
                        id => !respondedMentorIds.includes(id.toString())
                    );

                    const monthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-06"
                    for (const mentorId of ignoredMentorIds) {
                        try {
                            if (redis) {
                                const redisKey = `notif:ignored:${mentorId}:${monthKey}`;
                                const ignoreCount = await redis.incr(redisKey);
                                // Set 35-day TTL on first increment so key auto-expires after the month
                                if (ignoreCount === 1) {
                                    await redis.expire(redisKey, 35 * 24 * 60 * 60);
                                }
                                // Trigger warning at 7 ignores (and every 7 after that)
                                if (ignoreCount >= 7 && ignoreCount % 7 === 0) {
                                    await triggerMentorIgnoreWarning(mentorId, ignoreCount);
                                }
                            }
                        } catch (err) {
                            console.error(`[studentService] Failed to track ignore for mentor ${mentorId}:`, err.message);
                        }
                    }

                    // Cleanup any doubt-specific Redis cache
                    if (redis) await redis.del(`doubt:${doubtSession._id}`).catch(() => {});
                }
            }, 10 * 60 * 1000); // 10 minutes
        }

        return {
            doubtSessionId: doubtSession._id,
            mentorsNotified: mentorUserIds.length,
            message: sessionType === "scheduled"
                ? `Your doubt request has been posted for ${new Date(scheduledTime).toLocaleString()}. Matched mentors have been notified to send offers.`
                : "Your doubt has been sent to mentors. You will receive offers within 10 minutes."
        };
    }

    /**
     * Student selects a mentor from the offers received
     */
    selectMentor = async (userId, doubtSessionId, selectedMentorId) => {
        if (!mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Invalid doubt session ID");
        if (!mongoose.Types.ObjectId.isValid(selectedMentorId))
            throw new ApiError(400, "Invalid mentor ID");

        // Verify caller is a student
        const student = await studentRepository.findStudentId(userId);
        if (!student || student.role !== "student") {
            throw new ApiError(403, "Access denied. Only students can select mentors.");
        }

        // Verify selected user is a mentor and is verified
        const selectedMentor = await studentRepository.findStudentId(selectedMentorId);
        if (!selectedMentor || selectedMentor.role !== "mentor") {
            throw new ApiError(400, "Invalid mentor selection. Selected user is not a mentor.");
        }

        const selectedMentorProfile = await studentRepository.findMentorProfileByUserId(selectedMentorId);
        if (!selectedMentorProfile || !selectedMentorProfile.isVerifiedMentor) {
            throw new ApiError(400, "Invalid mentor selection. Selected mentor is not verified.");
        }

        // Check if the selected mentor is already busy in an active session
        const activeMentorSession = await studentRepository.findActiveSessionForMentor(selectedMentorId);
        if (activeMentorSession) {
            throw new ApiError(400, "This mentor is currently busy in another active session. Please select another mentor.");
        }

        const doubtSession = await studentRepository.findDoubtSessionByIdAndStudent(doubtSessionId, userId);
        if (!doubtSession || doubtSession.status !== "open") {
            throw new ApiError(404, "Doubt session not found or already closed.");
        }

        // Check if this mentor actually sent an offer
        const mentorOffer = doubtSession.mentorOffers.find(
            offer => offer.mentorId.toString() === selectedMentorId.toString()
        );
        if (!mentorOffer) throw new ApiError(404, "This mentor has not sent an offer for this doubt.");

        const notifyUnselectedMentors = () => {
            const unselectedMentors = doubtSession.mentorOffers
                .filter(offer => offer.mentorId.toString() !== selectedMentorId.toString())
                .map(offer => offer.mentorId);

            sendNotificationToMultipleUsers(unselectedMentors, "mentor_not_selected", {
                doubtSessionId: doubtSession._id,
                message: "Student has selected another mentor for this doubt."
            });
        };

        const startInstantSession = async () => {
            const chatRoomId = `doubt_${doubtSession._id}_${Date.now()}`;

            doubtSession.selectedMentorId = selectedMentorId;
            doubtSession.chatRoomId = chatRoomId;
            doubtSession.status = "in_session";
            doubtSession.sessionStartedAt = new Date();
            await studentRepository.saveDoubtSession(doubtSession);

            sendNotificationToUser(selectedMentorId, "mentor_selected_for_doubt", {
                doubtSessionId: doubtSession._id,
                chatRoomId,
                question: doubtSession.question,
                sessionDuration: doubtSession.sessionDuration,
                message: "Student accepted your offer. Join the chat room now."
            });

            notifyUnselectedMentors();
            createChatRoom(chatRoomId, userId, selectedMentorId, doubtSession.sessionDuration);

            return {
                chatRoomId,
                selectedMentorId,
                price: mentorOffer.price,
                sessionDuration: doubtSession.sessionDuration,
                message: "Mentor selected! Chat room is ready."
            };
        };

        // If mentor offer or student doubt session is scheduled, save future sessions for cron.
        const isScheduled = mentorOffer.sessionType === "scheduled" || doubtSession.sessionType === "scheduled";
        if (isScheduled) {
            const finalScheduledTime = mentorOffer.scheduledTime || doubtSession.scheduledTime;
            const scheduledDate = finalScheduledTime ? new Date(finalScheduledTime) : null;
            if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
                throw new ApiError(400, "Scheduled time is required for scheduled sessions.");
            }

            if (scheduledDate <= new Date()) {
                return await startInstantSession();
            }

            doubtSession.selectedMentorId = selectedMentorId;
            doubtSession.sessionType = "scheduled";
            doubtSession.scheduledTime = scheduledDate;
            doubtSession.status = "scheduled";
            await studentRepository.saveDoubtSession(doubtSession);

            notifyUnselectedMentors();

            const studentPayload = {
                doubtSessionId: doubtSession._id,
                studentName: student.name,
                mentorName: mentorOffer.mentorName || "Mentor",
                scheduledTime: scheduledDate,
                message: `Your doubt session is scheduled for ${scheduledDate.toLocaleString()}. It will start automatically at that time.`
            };
            sendNotificationToUser(userId, "meeting_scheduled", studentPayload);
            sendNotificationToUser(selectedMentorId, "meeting_scheduled", {
                ...studentPayload,
                message: `Student accepted your offer. The doubt session is scheduled for ${scheduledDate.toLocaleString()} and will start automatically at that time.`
            });

            const studentUser = await studentRepository.findStudentId(userId);
            const mentorUser = await studentRepository.findStudentId(selectedMentorId);
            if (studentUser && mentorUser) {
                const subject = "Doubt Session Scheduled - Solve-X";
                const htmlContent = `
                    <h2>Solve-X Doubt Session Scheduled</h2>
                    <p>Your doubt session for the question: "<strong>${doubtSession.question}</strong>" has been scheduled.</p>
                    <p>Meeting Time: <strong>${scheduledDate.toLocaleString()}</strong></p>
                    <p>Please log in and join the room at the scheduled time.</p>
                `;
                await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
            }

            return {
                selectedMentorId,
                price: mentorOffer.price,
                sessionType: "scheduled",
                scheduledTime: scheduledDate,
                message: "Mentor selected! Session is scheduled successfully and will start at the approved time."
            };
        }

        return await startInstantSession();
    }

    /**
     * Student ends session early (manual)
     */
    endSession = async (userId, doubtSessionId) => {
        if (!mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Invalid doubt session ID");

        const doubtSession = await studentRepository.findDoubtSessionByIdAndStudent(doubtSessionId, userId);
        if (!doubtSession || doubtSession.status !== "in_session") {
            throw new ApiError(404, "No active session found.");
        }

        doubtSession.status = "completed";
        doubtSession.sessionEndedAt = new Date();
        // Set TTL: auto-delete 4 hours after session ends
        doubtSession.expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
        await studentRepository.saveDoubtSession(doubtSession);

        // Notify mentor that session ended
        sendNotificationToUser(doubtSession.selectedMentorId, "session_ended", {
            doubtSessionId: doubtSession._id,
            message: "Student has ended the session."
        });

        // Manually destroy the chat room
        if (doubtSession.chatRoomId) {
            await destroyChatRoom(doubtSession.chatRoomId);
        }

        return { message: "Session ended successfully." };
    }

    studentDashboard = async ({ userId }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        // Clean up any expired active sessions first
        await cleanExpiredSessions();

        const data = await studentRepository.studentDashboard(userId);
        if (!data) throw new ApiError(404, "Student not found");

        return data;
    }

    getStudentDashboard = async (userId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        const user = await studentRepository.findStudentId(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "student") {
            throw new ApiError(403, "Access denied. Only students can access the student dashboard.");
        }

        let profile = await studentRepository.findStudentProfile(userId);
        if (!profile) {
            profile = await studentRepository.createStudentProfile(userId, { bio: "" });
        }

        let daysLeft = 0;
        if (profile.subscriptionStatus === "active" && profile.subscriptionExpiresAt) {
            const diffTime = new Date(profile.subscriptionExpiresAt) - new Date();
            daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const totalAsked = await studentRepository.countDoubtSessions(userId);
        const openAsked = await studentRepository.countDoubtSessions(userId, "open");
        const activeAsked = await studentRepository.countDoubtSessions(userId, ["in_session", "mentor_selected"]);
        const completedAsked = await studentRepository.countDoubtSessions(userId, "completed");

        // Calculate total spent on completed sessions
        const completedSessionsList = await studentRepository.findCompletedDoubtSessions(userId);
        let totalSpent = 0;
        completedSessionsList.forEach(session => {
            const offer = session.mentorOffers.find(o => o.mentorId.toString() === session.selectedMentorId?.toString());
            if (offer && offer.price) {
                totalSpent += offer.price;
            }
        });

        const recentSessions = await studentRepository.findRecentDoubtSessions(userId, 5);

        return {
            profile: {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                bio: profile.bio || "",
                socialLinks: profile.socialLinks || [],
                subscriptionStatus: profile.subscriptionStatus,
                subscriptionExpiresAt: profile.subscriptionExpiresAt,
                daysLeft
            },
            stats: {
                totalAsked,
                openAsked,
                activeAsked,
                completedAsked,
                totalSpent
            },
            recentSessions
        };
    }

    updateStudentProfile = async ({ userId, bio, name, socialLinks, skills, education, preferredLanguage, timezone }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        if (
            bio === undefined &&
            name === undefined &&
            socialLinks === undefined &&
            skills === undefined &&
            education === undefined &&
            preferredLanguage === undefined &&
            timezone === undefined
        ) {
            throw new ApiError(400, "Provide at least one field to update");
        }

        const result = {};

        if (
            bio !== undefined ||
            socialLinks !== undefined ||
            skills !== undefined ||
            education !== undefined ||
            preferredLanguage !== undefined ||
            timezone !== undefined
        ) {
            const updateData = {};
            if (bio !== undefined) updateData.bio = bio;
            if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
            if (skills !== undefined) updateData.skills = skills;
            if (education !== undefined) updateData.education = education;
            if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
            if (timezone !== undefined) updateData.timezone = timezone;
            result.profile = await studentRepository.updateStudentProfileFields(userId, updateData);
        }

        if (name) {
            result.user = await studentRepository.updateStudentName(userId, name);
        }

        return result;
    }

    getActiveSession = async (userId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        // Clean up any expired active sessions first
        await cleanExpiredSessions();

        let session = await studentRepository.findActiveSessionForStudentPopulated(userId);
        if (!session) {
            session = await studentRepository.findActiveSessionForMentor(userId);
        }

        return session;
    }

    getDoubtSessionOffers = async (userId, doubtSessionId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");
        if (!doubtSessionId || !mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Valid doubtSessionId is required");

        const session = await studentRepository.findDoubtSessionByIdAndStudentWithOffers(doubtSessionId, userId);

        if (!session) throw new ApiError(404, "Doubt session not found or unauthorized");

        const offers = session.mentorOffers || [];
        if (offers.length === 0) return [];

        const mentorUserIds = offers.map(o => o.mentorId._id || o.mentorId);
        const profiles = await MentorProfile.find({ userId: { $in: mentorUserIds } })
            .select("userId jobTitle company experienceYears rating ratingCount preferredLanguage");

        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));


        const detailedOffers = offers.map(offer => {
            const offerObj = offer.toObject ? offer.toObject() : offer;
            const mentorIdStr = (offer.mentorId._id || offer.mentorId).toString();
            const profile = profileMap.get(mentorIdStr);

            return {
                ...offerObj,
                mentorProfile: profile ? {
                    jobTitle: profile.jobTitle || "",
                    company: profile.company || "",
                    experienceYears: profile.experienceYears || 0,
                    rating: profile.rating || 5,
                    ratingCount: profile.ratingCount || 0,
                    preferredLanguage: profile.preferredLanguage || ""
                } : null
            };
        });

        return detailedOffers;
    }

    getDoubtSessionDetails = async (userId, doubtSessionId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");
        if (!doubtSessionId || !mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Valid doubtSessionId is required");

        const session = await studentRepository.findDoubtSessionByIdAndStudentWithDetails(doubtSessionId, userId);

        if (!session) throw new ApiError(404, "Doubt session not found or unauthorized");

        return session;
    }

    getStudentProfile = async ({ userId }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        const data = await studentRepository.getStudentProfileWithDetails(userId);
        if (!data) throw new ApiError(404, "Student profile not found");

        return data;
    }
    listMentorforStudent = async ({ userId, specializationName }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        const findStudent = await studentRepository.findStudentProfile(userId);
        if (!findStudent) throw new ApiError(401, "Unauthorized userId");

        const result = await studentRepository.getListOfMentorForStudent(specializationName);
        return result;
    }

    getMentorsForSpecialization = async (specializationId) => {
        if (!specializationId || !mongoose.Types.ObjectId.isValid(specializationId))
            throw new ApiError(400, "Valid specializationId is required");

        const mentors = await studentRepository.findMentorsWithProfileBySpecialization(specializationId);
        return mentors;
    }

    proposeReschedule = async (userId, doubtSessionId, newScheduledTime) => {
        if (!mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Invalid doubt session ID");
        if (!newScheduledTime)
            throw new ApiError(400, "newScheduledTime is required");

        const doubtSession = await studentRepository.findDoubtSessionById(doubtSessionId);
        if (!doubtSession || doubtSession.status !== "scheduled") {
            throw new ApiError(404, "Scheduled doubt session not found.");
        }

        // Verify caller is either student or mentor for this session
        const isStudent = doubtSession.studentId.toString() === userId.toString();
        const isMentor = doubtSession.selectedMentorId.toString() === userId.toString();
        if (!isStudent && !isMentor) {
            throw new ApiError(403, "Access denied.");
        }

        doubtSession.rescheduleRequest = {
            proposedBy: userId,
            newScheduledTime: new Date(newScheduledTime),
            status: "pending"
        };
        await studentRepository.saveDoubtSession(doubtSession);

        // Notify the other user
        const targetUserId = isStudent ? doubtSession.selectedMentorId : doubtSession.studentId;
        const proposerName = isStudent ? "Student" : "Mentor";
        await sendNotificationToUser(targetUserId, "reschedule_requested", {
            doubtSessionId: doubtSession._id,
            proposedBy: userId,
            newScheduledTime,
            message: `${proposerName} has requested to reschedule the meeting to ${new Date(newScheduledTime).toLocaleString()}.`
        });

        return { message: "Reschedule request sent successfully." };
    }

    respondReschedule = async (userId, doubtSessionId, action, reason = "") => {
        if (!mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Invalid doubt session ID");
        if (!["approve", "reject"].includes(action))
            throw new ApiError(400, "Action must be approve or reject");

        const doubtSession = await studentRepository.findDoubtSessionById(doubtSessionId);
        if (!doubtSession || doubtSession.status !== "scheduled" || !doubtSession.rescheduleRequest) {
            throw new ApiError(404, "Reschedule request not found.");
        }

        // Must be responded by the other user (not the one who proposed it)
        if (doubtSession.rescheduleRequest.proposedBy.toString() === userId.toString()) {
            throw new ApiError(403, "You cannot respond to your own reschedule request.");
        }

        const isStudent = doubtSession.studentId.toString() === userId.toString();
        const isMentor = doubtSession.selectedMentorId.toString() === userId.toString();
        if (!isStudent && !isMentor) {
            throw new ApiError(403, "Access denied.");
        }

        const targetUserId = doubtSession.rescheduleRequest.proposedBy;

        if (action === "approve") {
            const newTime = doubtSession.rescheduleRequest.newScheduledTime;
            doubtSession.scheduledTime = newTime;
            doubtSession.rescheduleRequest.status = "approved";

            // Save and clean up request
            doubtSession.rescheduleRequest = null;
            await studentRepository.saveDoubtSession(doubtSession);

            // Fetch user details for email
            const studentUser = await studentRepository.findStudentId(doubtSession.studentId);
            const mentorUser = await studentRepository.findStudentId(doubtSession.selectedMentorId);

            // Send notification
            const payload = {
                doubtSessionId: doubtSession._id,
                scheduledTime: newTime,
                message: "Reschedule request approved. The new meeting time is set."
            };
            await sendNotificationToUser(targetUserId, "reschedule_approved", payload);
            await sendNotificationToUser(userId, "reschedule_approved", payload);

            // Send emails
            if (studentUser && mentorUser) {
                const subject = "Meeting Rescheduled - Solve-X";
                const htmlContent = `
                    <h2>Solve-X Doubt Session Rescheduled</h2>
                    <p>Your scheduled doubt session has been successfully rescheduled to: <strong>${newTime.toLocaleString()}</strong>.</p>
                `;
                await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
            }
            return { message: "Reschedule request approved successfully." };
        } else {
            // Rejection flow
            // If the responder is the mentor, warn them and ask for/validate reason
            const isMentorResponder = doubtSession.selectedMentorId.toString() === userId.toString();
            if (isMentorResponder) {
                if (!reason || reason.trim() === "") {
                    throw new ApiError(400, "Reason is required when a mentor rejects a reschedule request.");
                }

                // Retrieve mentor profile
                const mentorProfile = await MentorProfile.findOne({ userId });
                if (mentorProfile) {
                    const now = new Date();
                    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

                    // Add current rejection
                    mentorProfile.rescheduleRejections.push({
                        doubtSessionId: doubtSession._id,
                        reason: reason.trim(),
                        date: now
                    });

                    // Count rejections in the last 2 weeks
                    const recentRejectionsCount = mentorProfile.rescheduleRejections.filter(
                        rej => rej.date >= twoWeeksAgo
                    ).length;

                    let warningMsg = "Reschedule request was rejected.";
                    let penaltyApplied = false;

                    // If it is 3 or more times in 2 weeks
                    if (recentRejectionsCount >= 3) {
                        mentorProfile.penalties.push({
                            amount: 100,
                            reason: `Excessive reschedule rejections (${recentRejectionsCount} in last 2 weeks)`,
                            date: now
                        });
                        mentorProfile.warnings.push({
                            warningType: "penalty_applied",
                            reason: `Penalty of 100 INR applied due to ${recentRejectionsCount} reschedule rejections in 2 weeks.`,
                            date: now
                        });
                        penaltyApplied = true;
                        warningMsg = `Reschedule request was rejected. A penalty of 100 INR has been applied to your account because you have rejected reschedule requests ${recentRejectionsCount} times in the last 2 weeks.`;
                    } else {
                        mentorProfile.warnings.push({
                            warningType: "rejection_warning",
                            reason: `Reschedule request rejected. Rejections in last 2 weeks: ${recentRejectionsCount}. Limit before penalty: 3.`,
                            date: now
                        });
                        warningMsg = `Reschedule request was rejected. Warning: Rejecting 3 or more reschedule requests in a 2-week period will result in a 100 INR penalty. (Current rejections: ${recentRejectionsCount})`;
                    }

                    await mentorProfile.save();

                    // Send platform warning notification to mentor
                    await sendNotificationToUser(userId, "mentor_reschedule_warning", {
                        doubtSessionId: doubtSession._id,
                        rejectionsCount: recentRejectionsCount,
                        penaltyApplied,
                        message: warningMsg
                    });
                }
            }

            doubtSession.rescheduleRequest.status = "rejected";
            doubtSession.rescheduleRequest = null;
            await studentRepository.saveDoubtSession(doubtSession);

            await sendNotificationToUser(targetUserId, "reschedule_rejected", {
                doubtSessionId: doubtSession._id,
                reason,
                message: "Reschedule request was rejected."
            });
            return { message: "Reschedule request rejected." };
        }
    }
}

export default new studentService()
