import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import studentRepository from '../repositorys/implimentations/mongo.student.repository.js'
import { sendNotificationToMultipleUsers, sendNotificationToUser, createChatRoom, destroyChatRoom } from "../helpers/socket/socket.helper.js"

class studentService {

    /**
     * Student posts a doubt — creates DoubtSession + notifies all verified mentors of that skill
     */
    skillMatchingByStudent = async (userId, skillIdentifier, selectSessionTime, typeWriteQuestion) => {
        if (!mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(401, "Student id's not valid")
        if (!mongoose.Types.ObjectId.isValid(skillIdentifier))
            throw new ApiError(401, "Skill id's not valid")

        const isExisted = await studentRepository.findStudentId(userId)
        if (!isExisted) throw new ApiError(404, "Unauthorized student!")
        if (isExisted.role !== "student") {
            throw new ApiError(403, "Access denied. Only students can post doubts.");
        }

        if (!skillIdentifier || !selectSessionTime || !typeWriteQuestion)
            throw new ApiError(400, "These all are required fields.");

        // Check if student already has an active doubt session
        const activeSession = await studentRepository.findActiveSessionForStudent(userId);
        if (activeSession) {
            throw new ApiError(400, "You already have an active doubt session. Please complete or cancel it first.");
        }

        const isSkillExisted = await studentRepository.findSkillandSlug(skillIdentifier);
        if (!isSkillExisted) throw new ApiError(404, "This skill is not available currently.");

        const mentors = await studentRepository.findMentorBySkill(isSkillExisted._id);
        if (!mentors || mentors.length === 0) {
            throw new ApiError(404, "No mentors are currently available for this skill.");
        }

        // Create DoubtSession in DB (status: open)
        const doubtSession = await studentRepository.createDoubtSession({
            studentId: userId,
            skillId: isSkillExisted._id,
            question: typeWriteQuestion,
            sessionDuration: selectSessionTime,
            status: "open"
        });

        // Notify all matched mentors
        const notificationPayload = {
            doubtSessionId: doubtSession._id,
            studentName: isExisted.name,
            question: typeWriteQuestion,
            skillName: isSkillExisted.name,
            sessionDuration: selectSessionTime
        };

        const mentorUserIds = mentors
            .filter(mentor => mentor && mentor.userId)
            .map(mentor => mentor.userId._id);
        sendNotificationToMultipleUsers(
            mentorUserIds,
            "student_asked_question",
            notificationPayload
        );

        // Set 10-minute expiry for mentor offers
        setTimeout(async () => {
            const session = await studentRepository.findDoubtSessionById(doubtSession._id);
            if (session && session.status === "open") {
                session.status = "expired";
                await studentRepository.saveDoubtSession(session);
                // Notify student that no mentor responded in time
                sendNotificationToUser(userId, "doubt_expired", {
                    doubtSessionId: doubtSession._id,
                    message: "No mentor responded within 10 minutes. Please try again."
                });
            }
        }, 10 * 60 * 1000); // 10 minutes

        return {
            doubtSessionId: doubtSession._id,
            mentorsNotified: mentorUserIds.length,
            message: "Your doubt has been sent to mentors. You will receive offers within 10 minutes."
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

        // Generate unique chat room ID
        const chatRoomId = `doubt_${doubtSession._id}_${Date.now()}`;

        // Update DoubtSession
        doubtSession.selectedMentorId = selectedMentorId;
        doubtSession.chatRoomId = chatRoomId;
        doubtSession.status = "in_session";
        doubtSession.sessionStartedAt = new Date();
        await studentRepository.saveDoubtSession(doubtSession);

        // Notify the selected mentor
        sendNotificationToUser(selectedMentorId, "mentor_selected_for_doubt", {
            doubtSessionId: doubtSession._id,
            chatRoomId,
            question: doubtSession.question,
            sessionDuration: doubtSession.sessionDuration,
            message: "Student has selected you! Join the chat room."
        });

        // Notify unselected mentors
        const unselectedMentors = doubtSession.mentorOffers
            .filter(offer => offer.mentorId.toString() !== selectedMentorId.toString())
            .map(offer => offer.mentorId);

        sendNotificationToMultipleUsers(unselectedMentors, "mentor_not_selected", {
            doubtSessionId: doubtSession._id,
            message: "Student has selected another mentor for this doubt."
        });

        // Notify the student to join chat room
        sendNotificationToUser(userId, "join_chat_room", {
            doubtSessionId: doubtSession._id,
            chatRoomId,
            mentorId: selectedMentorId,
            mentorName: mentorOffer.mentorName || "Mentor",
            price: mentorOffer.price,
            sessionDuration: doubtSession.sessionDuration
        });

        // Create chat room via socket helper
        createChatRoom(chatRoomId, userId, selectedMentorId, doubtSession.sessionDuration);

        return {
            chatRoomId,
            selectedMentorId,
            price: mentorOffer.price,
            sessionDuration: doubtSession.sessionDuration,
            message: "Mentor selected! Chat room is ready."
        };
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
        const activeAsked = await studentRepository.countDoubtSessions(userId, "in_session");
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

        const session = await studentRepository.findActiveSessionForStudentPopulated(userId);

        return session;
    }

    getDoubtSessionOffers = async (userId, doubtSessionId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");
        if (!doubtSessionId || !mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Valid doubtSessionId is required");

        const session = await studentRepository.findDoubtSessionByIdAndStudentWithOffers(doubtSessionId, userId);

        if (!session) throw new ApiError(404, "Doubt session not found or unauthorized");

        return session.mentorOffers;
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
}

export default new studentService()