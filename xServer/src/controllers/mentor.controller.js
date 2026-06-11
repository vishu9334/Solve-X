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
    const userId = req.user.userId;
    const { attemptId, sessionId, answers } = req.body;

    const data = await mentorService.submitAssessment({
        userId,
        attemptId,
        sessionId,
        answers
    });

    return res.status(200).json(
        new ApiResponse(200, data, "Assessment submitted and evaluated successfully.")
    );
});