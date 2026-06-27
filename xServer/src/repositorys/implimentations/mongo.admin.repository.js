import mongoose from "mongoose";
import IAdminRepository from "../contracts/IAdmin.contract.js";
import { CommonUser } from "../../models/AbaseUser.model.js";
import { AdminProfile } from "../../models/AadminProfile.model.js";

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
                $set: {
                    bio: "$result.bio",
                    socialLinks: "$result.socialLinks"
                }
            },
            {
                $unset: [
                    "_id",
                    "password",
                    "userId",
                    "updatedAt",
                    "result"
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
        return await AdminProfile.create({ userId });
    }

    /**
     * Update AdminProfile fields (e.g. bio, socialLinks) by userId.
     * @param {string} userId
     * @param {object} updateData - e.g. { bio: "...", socialLinks: [...] }
     * @returns {object|null} updated profile
     */
    async updateAdminProfile(userId, updateData) {
        return await AdminProfile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true }  // create if not exists
        );
    }

    async findUserById(userId) {
        return await CommonUser.findById(userId);
    }

    async getAdminDashboardStats(onlineIds) {
        const { MentorProfile } = await import("../../models/AmentorProfile.model.js");
        const { StudentProfile } = await import("../../models/AstudentProfile.model.js");
        const { DoubtSession } = await import("../../models/doubtSession.model.js");
        const { Specialization } = await import("../../models/specialization.model.js");
        const { Attempt } = await import("../../models/assessmentAttempt.model.js");

        // 1. User role distribution counts
        const totalStudents = await CommonUser.countDocuments({ role: "student" });
        const totalMentors = await CommonUser.countDocuments({ role: "mentor" });

        // 2. Online/Active socket user counts
        const onlineStudents = await CommonUser.countDocuments({ _id: { $in: onlineIds }, role: "student" });
        const onlineMentors = await CommonUser.countDocuments({ _id: { $in: onlineIds }, role: "mentor" });

        // 3. Mentor verification breakdown
        const approvedMentors = await MentorProfile.countDocuments({ isVerifiedMentor: true });
        const pendingMentors = await MentorProfile.countDocuments({ verificationStatus: "pending" });

        // 4. Subscriptions count
        const activeSubscriptions = await StudentProfile.countDocuments({ subscriptionStatus: "active" });

        // 5. Doubt session metrics
        const totalDoubtSessions = await DoubtSession.countDocuments();
        const openDoubtSessions = await DoubtSession.countDocuments({ status: "open" });
        const liveDoubtSessions = await DoubtSession.countDocuments({ status: "in_session" });
        const completedDoubtSessions = await DoubtSession.countDocuments({ status: "completed" });

        // 6. Recent sessions list
        const recentSessions = await DoubtSession.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("studentId", "name email")
            .populate("selectedMentorId", "name email");

        // 7. Popular skills list
        const popularSpecializations = await Specialization.find({ isActive: true })
            .select("name mentorCount source")
            .sort({ mentorCount: -1 })
            .limit(5);

        // 8. User growth stats (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newStudents = await CommonUser.countDocuments({ role: "student", createdAt: { $gte: sevenDaysAgo } });
        const newMentors = await CommonUser.countDocuments({ role: "mentor", createdAt: { $gte: sevenDaysAgo } });

        // 9. AI Proctoring Flags & Assessment stats
        const totalAttempts = await Attempt.countDocuments();
        const passedAttempts = await Attempt.countDocuments({ status: "passed" });
        const failedAttempts = await Attempt.countDocuments({ status: "failed" });
        
        let totalWarnings = 0;
        try {
            const warningAggregation = await mongoose.model("AssessmentActivitySession").aggregate([
                { $group: { _id: null, totalWarnings: { $sum: "$warningCount" } } }
            ]);
            totalWarnings = warningAggregation[0]?.totalWarnings || 0;
        } catch (e) {
            console.error("Failed to aggregate proctoring warnings in repository:", e.message);
        }

        return {
            users: {
                totalStudents,
                totalMentors,
                onlineStudents,
                onlineMentors,
                offlineStudents: Math.max(0, totalStudents - onlineStudents),
                offlineMentors: Math.max(0, totalMentors - onlineMentors),
                growth: {
                    newStudents,
                    newMentors,
                    periodDays: 7
                }
            },
            mentors: {
                approvedMentors,
                pendingMentors,
                inactiveMentors: Math.max(0, totalMentors - approvedMentors)
            },
            subscriptions: {
                activeSubscriptions,
                inactiveSubscriptions: Math.max(0, totalStudents - activeSubscriptions)
            },
            proctoringFlagStats: {
                totalAttempts,
                passedAttempts,
                failedAttempts,
                totalWarnings
            },
            doubtSessions: {
                total: totalDoubtSessions,
                open: openDoubtSessions,
                live: liveDoubtSessions,
                completed: completedDoubtSessions
            },
            recentSessions,
            popularSpecializations
        };
    }
}

const adminRepository = new MongoAdminRepository();
export default adminRepository;