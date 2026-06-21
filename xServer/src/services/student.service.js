import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"
import studentRepository from '../repositorys/implimentations/mongo.student.repository.js'
import { sendNotificationToMultipleUsers, sendNotificationToUser, createChatRoom, destroyChatRoom } from "../helpers/socket/socket.helper.js"
import { DoubtSession } from "../models/doubtSession.model.js"

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
        const activeSession = await DoubtSession.findOne({
            studentId: userId,
            status: { $in: ["open", "mentor_selected", "in_session"] }
        });
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
            const session = await DoubtSession.findById(doubtSession._id);
            if (session && session.status === "open") {
                session.status = "expired";
                await session.save();
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
        const { CommonUser } = await import("../models/AbaseUser.model.js");
        const { MentorProfile } = await import("../models/AmentorProfile.model.js");

        const selectedMentor = await CommonUser.findById(selectedMentorId);
        if (!selectedMentor || selectedMentor.role !== "mentor") {
            throw new ApiError(400, "Invalid mentor selection. Selected user is not a mentor.");
        }

        const selectedMentorProfile = await MentorProfile.findOne({ userId: selectedMentorId });
        if (!selectedMentorProfile || !selectedMentorProfile.isVerifiedMentor) {
            throw new ApiError(400, "Invalid mentor selection. Selected mentor is not verified.");
        }

        // Check if the selected mentor is already busy in an active session
        const activeMentorSession = await DoubtSession.findOne({
            selectedMentorId,
            status: "in_session"
        });
        if (activeMentorSession) {
            throw new ApiError(400, "This mentor is currently busy in another active session. Please select another mentor.");
        }

        const doubtSession = await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId: userId,
            status: "open"
        });
        if (!doubtSession) throw new ApiError(404, "Doubt session not found or already closed.");

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
        await doubtSession.save();

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

        const doubtSession = await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId: userId,
            status: "in_session"
        });
        if (!doubtSession) throw new ApiError(404, "No active session found.");

        doubtSession.status = "completed";
        doubtSession.sessionEndedAt = new Date();
        // Set TTL: auto-delete 4 hours after session ends
        doubtSession.expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
        await doubtSession.save();

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

    updateStudentProfile = async ({ userId, bio, name }) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        if (!bio && !name)
            throw new ApiError(400, "Provide at least bio or name to update");

        const result = {};

        if (bio) {
            result.profile = await studentRepository.updateStudentBio(userId, bio);
        }

        if (name) {
            result.user = await studentRepository.updateStudentName(userId, name);
        }

        return result;
    }

    getActiveSession = async (userId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");

        const session = await DoubtSession.findOne({
            studentId: userId,
            status: { $in: ["open", "mentor_selected", "in_session"] }
        }).populate("selectedMentorId", "name email avatar");

        return session;
    }

    getDoubtSessionOffers = async (userId, doubtSessionId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");
        if (!doubtSessionId || !mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Valid doubtSessionId is required");

        const session = await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId: userId
        }).populate("mentorOffers.mentorId", "name email avatar");

        if (!session) throw new ApiError(404, "Doubt session not found or unauthorized");

        return session.mentorOffers;
    }

    getDoubtSessionDetails = async (userId, doubtSessionId) => {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId))
            throw new ApiError(400, "Valid userId is required");
        if (!doubtSessionId || !mongoose.Types.ObjectId.isValid(doubtSessionId))
            throw new ApiError(400, "Valid doubtSessionId is required");

        const session = await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId: userId
        })
        .populate("selectedMentorId", "name email avatar")
        .populate("skillId", "name slug");

        if (!session) throw new ApiError(404, "Doubt session not found or unauthorized");

        return session;
    }
}

export default new studentService()