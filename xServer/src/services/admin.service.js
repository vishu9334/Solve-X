import { ApiError } from "../utils/ApiError.js";
import adminRepository from "../repositorys/implimentations/mongo.admin.repository.js";

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
     * Update admin profile fields (bio, etc.).
     * @param {string} userId
     * @param {object} updateData - e.g. { bio: "..." }
     */
    async updateAdminProfile({ userId, updateData }) {
        if (!userId) throw new ApiError(400, "userId is required");
        if (!updateData || Object.keys(updateData).length === 0) {
            throw new ApiError(400, "No update data provided");
        }

        const updated = await adminRepository.updateAdminProfile(userId, updateData);
        return updated;
    }
}

export default new adminService();