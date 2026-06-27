import { Router } from "express";
import { Specialization } from "../models/specialization.model.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Public — list all active specializations (mentors browse this)
router.get("/specializations", asyncHandler(async (req, res) => {
    const specializations = await Specialization.find({ isActive: true })
        .select("name slug description mentorCount source")
        .sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, specializations, "Specializations fetched successfully.")
    );
}));

export default router;
