import { ApiError } from "../utils/ApiError.js";
import adminRepository from "../repositorys/implimentations/mongo.admin.repository.js";
import mongoose from "mongoose";

class adminService {

    /**
     * Get admin profile data by userId (aggregation).
     * @param {string} userId
     */
    async adminProfile({ userId }) {
        if (!userId) throw new ApiError(400, "userId is required");

        const data = await adminRepository.getAdminProfileWithDetails(userId);
        if (!data) throw new ApiError(404, "Admin profile not found");

        return data;
    }

    /**
     * Create adminProfile document (called on admin registration).
     * @param {string} userId
     */
    async createAdminProfile({ userId }) {
        if (!userId) throw new ApiError(400, "userId is required");

        return await adminRepository.createAdminProfile(userId);
    }

    /**
     * Update admin profile fields (bio, socialLinks).
     * @param {string} userId
     * @param {string} bio
     * @param {array} socialLinks
     */
    async updateAdminProfile({ userId, bio, socialLinks }) {
        if (!userId) throw new ApiError(400, "userId is required");
        
        if (bio === undefined && socialLinks === undefined) {
            throw new ApiError(400, "Provide bio or socialLinks to update");
        }

        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

        const updated = await adminRepository.updateAdminProfile(userId, updateData);
        return updated;
    }

    async getAdminDashboard(userId) {
        if (!userId) throw new ApiError(400, "userId is required");

        // 1. Verify user is admin
        const user = await adminRepository.findUserById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "admin") {
            throw new ApiError(403, "Access denied. Only admins can access the admin dashboard.");
        }

        const allowedAdmins = ["connect.solvex99@gmail.com", "vishalkumarptn32@gmail.com"];
        if (!allowedAdmins.includes(user.email.toLowerCase())) {
            throw new ApiError(403, "Access denied. This email is not authorized for admin access.");
        }

        // 2. Fetch socket online IDs
        const { getOnlineUsers } = await import("../helpers/socket/socket.helper.js");
        const onlineIds = getOnlineUsers();

        return await adminRepository.getAdminDashboardStats(onlineIds);
    }
}

export default new adminService();