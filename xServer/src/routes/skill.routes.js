import { Router } from "express";
import { Skill } from "../models/skill.model.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Public — list all active skills (mentors browse this)
router.get("/skills", asyncHandler(async (req, res) => {
    const skills = await Skill.find({ isActive: true })
        .select("name slug description mentorCount source")
        .sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, skills, "Skills fetched successfully.")
    );
}));

export default router;
