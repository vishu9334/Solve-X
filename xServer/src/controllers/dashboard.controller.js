import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { CommonUser } from "../models/AbaseUser.model.js";
import { StudentProfile } from "../models/AstudentProfile.model.js";
import { MentorProfile } from "../models/AmentorProfile.model.js";
import { DoubtSession } from "../models/doubtSession.model.js";
import { Skill } from "../models/skill.model.js";
import mentorService from "../services/mentor.service.js";

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
        const userId = req.user?._id || req.user?.userId;

        // 1. Verify user is mentor
        const user = await CommonUser.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        if (user.role !== "mentor") {
            throw new ApiError(403, "Access denied. Only mentors can access the mentor dashboard.");
        }

        // 2. Fetch mentor dashboard using service (single-query aggregation)
        const dashboardData = await mentorService.getMentorDashboard(userId);

        return res.status(200).json(
            new ApiResponse(200, dashboardData, "Mentor dashboard data fetched successfully.")
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
