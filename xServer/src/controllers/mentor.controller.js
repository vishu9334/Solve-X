import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mentorService from "../services/mentor.service.js";

export const selectSkill = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { skillId, skillName } = req.body;

    if (!skillId && !skillName) throw new ApiError(400, "Either skillId or skillName is required.");

    const data = await mentorService.selectSkill(userId, { skillId, skillName });

    return res.status(200).json(
        new ApiResponse(200, data, "Skill selected and assessment ready.")
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
    const userId = req.user.userId;
    const { doubtSessionId, price, availableTime } = req.body;

    if (!doubtSessionId || price === undefined) {
        throw new ApiError(400, "doubtSessionId and price are required.");
    }

    const data = await mentorService.replyToStudentDoubt(userId, {
        doubtSessionId,
        price,
        availableTime
    });

    return res.status(200).json(
        new ApiResponse(200, data, "Offer sent to student.")
    );
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


