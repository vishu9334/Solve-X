import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import adminService from "../services/admin.service.js";

/**
 * GET /api/v1/admin/profile
 * Returns the logged-in admin's full profile (user + adminProfile joined).
 */
export const getAdminProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const data = await adminService.adminProfile({ userId });

    return res.status(200).json(
        new ApiResponse(200, data, "Admin profile fetched successfully.")
    );
});

/**
 * PATCH /api/v1/admin/profile
 * Update admin profile fields (bio, etc.).
 * Body: { bio: "..." }
 */
export const updateAdminProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { bio } = req.body;

    if (!bio) throw new ApiError(400, "bio is required");

    const updated = await adminService.updateAdminProfile({
        userId,
        updateData: { bio }
    });

    return res.status(200).json(
        new ApiResponse(200, updated, "Admin profile updated successfully.")
    );
});
