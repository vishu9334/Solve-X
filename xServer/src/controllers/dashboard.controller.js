import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { CommonUser } from "../models/AbaseUser.model.js";
import { StudentProfile } from "../models/AstudentProfile.model.js";
import { MentorProfile } from "../models/AmentorProfile.model.js";
import { DoubtSession } from "../models/doubtSession.model.js";
import { Skill } from "../models/skill.model.js";

class DashboardController {
    /**
     * Get dashboard details for Student
     */
    getStudentDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id;

        // 1. Verify user is student
        const user = await CommonUser.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "student") {
            throw new ApiError(403, "Access denied. Only students can access the student dashboard.");
        }

        // 2. Fetch or create student profile for subscription status
        let profile = await StudentProfile.findOne({ userId });
        if (!profile) {
            profile = await StudentProfile.create({ userId, bio: "" });
        }

        // 3. Aggregate stats
        const totalAsked = await DoubtSession.countDocuments({ studentId: userId });
        const openAsked = await DoubtSession.countDocuments({ studentId: userId, status: "open" });
        const activeAsked = await DoubtSession.countDocuments({ studentId: userId, status: "in_session" });
        const completedAsked = await DoubtSession.countDocuments({ studentId: userId, status: "completed" });

        // 4. Fetch 5 recent doubt sessions
        const recentSessions = await DoubtSession.find({ studentId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("selectedMentorId", "name email avatar");

        return res.status(200).json(
            new ApiResponse(200, {
                profile: {
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    subscriptionStatus: profile.subscriptionStatus,
                    subscriptionExpiresAt: profile.subscriptionExpiresAt
                },
                stats: {
                    totalAsked,
                    openAsked,
                    activeAsked,
                    completedAsked
                },
                recentSessions
            }, "Student dashboard data fetched successfully.")
        );
    });

    /**
     * Get dashboard details for Mentor
     */
    getMentorDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id;

        // 1. Verify user is mentor
        const user = await CommonUser.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "mentor") {
            throw new ApiError(403, "Access denied. Only mentors can access the mentor dashboard.");
        }

        // 2. Fetch mentor profile
        const profile = await MentorProfile.findOne({ userId }).populate("skillCategory");
        if (!profile) {
            throw new ApiError(404, "Mentor profile not found.");
        }

        let stats = null;
        let recentSessions = [];
        let opportunities = [];
        let activeSession = null;

        // 3. If verified, get stats and open opportunities
        if (profile.isVerifiedMentor) {
            const completedSessions = await DoubtSession.find({
                selectedMentorId: userId,
                status: "completed"
            });

            // Calculate earnings
            let totalEarnings = 0;
            completedSessions.forEach(session => {
                const offer = session.mentorOffers.find(o => o.mentorId.toString() === userId.toString());
                if (offer) {
                    totalEarnings += offer.price;
                }
            });

            // Active session
            activeSession = await DoubtSession.findOne({
                selectedMentorId: userId,
                status: "in_session"
            }).populate("studentId", "name email avatar");

            // Recent resolved sessions
            recentSessions = await DoubtSession.find({
                selectedMentorId: userId,
                status: "completed"
            })
                .sort({ sessionEndedAt: -1 })
                .limit(5)
                .populate("studentId", "name email avatar");

            // Open opportunities matching skill category
            if (profile.skillCategory) {
                opportunities = await DoubtSession.find({
                    skillId: profile.skillCategory._id,
                    status: "open",
                    "mentorOffers.mentorId": { $ne: userId } // Don't show if already offered
                })
                    .sort({ createdAt: -1 })
                    .populate("studentId", "name email avatar");
            }

            stats = {
                totalResolved: completedSessions.length,
                totalEarnings,
                hasActiveSession: !!activeSession
            };
        }

        return res.status(200).json(
            new ApiResponse(200, {
                profile: {
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isVerifiedMentor: profile.isVerifiedMentor,
                    verificationStatus: profile.verificationStatus,
                    skill: profile.skillCategory ? {
                        name: profile.skillCategory.name,
                        slug: profile.skillCategory.slug
                    } : null,
                    rejectionReason: profile.rejectionReason
                },
                stats,
                activeSession,
                recentSessions,
                opportunities
            }, "Mentor dashboard data fetched successfully.")
        );
    });

    /**
     * Get dashboard details for Admin
     */
    getAdminDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id;

        // 1. Verify user is admin
        const user = await CommonUser.findById(userId);
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

        // 2. User role distribution counts
        const totalStudents = await CommonUser.countDocuments({ role: "student" });
        const totalMentors = await CommonUser.countDocuments({ role: "mentor" });

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
        const popularSkills = await Skill.find({ isActive: true })
            .select("name mentorCount source")
            .sort({ mentorCount: -1 })
            .limit(5);

        return res.status(200).json(
            new ApiResponse(200, {
                users: {
                    totalStudents,
                    totalMentors
                },
                mentors: {
                    approvedMentors,
                    pendingMentors
                },
                subscriptions: {
                    activeSubscriptions
                },
                doubtSessions: {
                    total: totalDoubtSessions,
                    open: openDoubtSessions,
                    live: liveDoubtSessions,
                    completed: completedDoubtSessions
                },
                recentSessions,
                popularSkills
            }, "Admin dashboard data fetched successfully.")
        );
    });
}

export default new DashboardController();
