import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mentorService from "../services/mentor.service.js";
import studentService from "../services/student.service.js";

export const selectSpecialization = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { specializationId, specializationName } = req.body;

    const data = await mentorService.selectSpecialization(userId, { specializationId, specializationName });

    return res.status(200).json(
        new ApiResponse(200, data, "specialization selected and assessment ready.")
    );
});

export const submitAssessment = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.userId;
    const { attemptId } = req.params;
    const { answers } = req.body;

    const data = await mentorService.submitAssessment({
        userId,
        attemptId,
        answers
    });

    return res.status(200).json(
        new ApiResponse(200, data, "Assessment submitted and evaluated successfully.")
    );
});

export const replyToStudentDoubt = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || req.user?._id;
    const data = await mentorService.replyToStudentDoubt(userId, req.body);
    return res.status(200).json(
        new ApiResponse(200, data, "Offer sent to student.")
    );
});

export const getActiveAssessment = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await mentorService.getActiveAssessment(userId);
    return res.status(200).json(new ApiResponse(200, data, "Active assessment fetched successfully"));
});

export const mentorProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await mentorService.mentorProfile(userId);
    return res.status(200).json(new ApiResponse(200, data, "Mentor profile data fetched successfully"));
});

export const updateMentorDescription = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { description } = req.body;
    const data = await mentorService.updateMentorDescription(userId, description);
    return res.status(200).json(new ApiResponse(200, data, "Skill description updated successfully"));
});

export const updateMentorProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await mentorService.updateMentorProfile(userId, req.body);
    return res.status(200).json(new ApiResponse(200, data, "Mentor profile updated successfully"));
});

export const proposeReschedule = asyncHandler(async (req, res) => {
    const { doubtSessionId } = req.params;
    const { newScheduledTime } = req.body;
    const userId = req.user?._id || req.user?.userId;

    const response = await studentService.proposeReschedule(userId, doubtSessionId, newScheduledTime);
    res.status(200).json(new ApiResponse(200, response, "Reschedule request sent successfully."));
});

export const rejectScheduledDoubt = asyncHandler(async (req, res) => {
    const { doubtSessionId } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id || req.user?.userId;

    const data = await mentorService.rejectScheduledDoubt(userId, doubtSessionId, reason);
    return res.status(200).json(new ApiResponse(200, data, "Scheduled doubt session cancelled successfully"));
});
