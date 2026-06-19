import mongoose from "mongoose";
import IAdminRepository from "../contracts/IAdmin.contract.js";
import { CommonUser } from "../../models/AbaseUser.model.js";
import { adminProfile } from "../../models/AadminProfile.model.js";

class MongoAdminRepository extends IAdminRepository {

    /**
     * Fetch admin user data + profile using aggregation.
     * Joins CommonUser with adminprofiles via userId.
     * @param {string} userId - The user's _id string
     * @returns {object|null} - Merged admin data or null
     */
    async getAdminProfileWithDetails(userId) {
        const result = await CommonUser.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "adminprofiles",
                    localField: "_id",
                    foreignField: "userId",
                    as: "result"
                }
            },
            {
                $set: {
                    result: { $arrayElemAt: ["$result", 0] }
                }
            },
            {
                $unset: [
                    "_id",
                    "password",
                    "userId",
                    "updatedAt",
                    "result._id",
                    "result.userId",
                    "result.createdAt",
                    "result.updatedAt"
                ]
            }
        ]);

        return result[0] || null;
    }

    /**
     * Create adminProfile document for a newly registered admin.
     * @param {string} userId
     * @returns {object} created profile
     */
    async createAdminProfile(userId) {
        return await adminProfile.create({ userId });
    }

    /**
     * Update adminProfile fields (e.g. bio) by userId.
     * @param {string} userId
     * @param {object} updateData - e.g. { bio: "..." }
     * @returns {object|null} updated profile
     */
    async updateAdminProfile(userId, updateData) {
        return await adminProfile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true }  // create if not exists
        );
    }
}

const adminRepository = new MongoAdminRepository();
export default adminRepository;