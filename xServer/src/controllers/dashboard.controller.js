import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import mentorService from "../services/mentor.service.js";
import studentService from "../services/student.service.js";
import adminService from "../services/admin.service.js";

class DashboardController {
    /**
     * Get dashboard details for Student
     */
    getStudentDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const dashboardData = await studentService.getStudentDashboard(userId);

        return res.status(200).json(
            new ApiResponse(200, dashboardData, "Student dashboard data fetched successfully.")
        );
    });

    /**
     * Get dashboard details for Mentor
     */
    getMentorDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const dashboardData = await mentorService.getMentorDashboard(userId);

        return res.status(200).json(
            new ApiResponse(200, dashboardData, "Mentor dashboard data fetched successfully.")
        );
    });

    /**
     * Get dashboard details for Admin
     */
    getAdminDashboard = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const dashboardData = await adminService.getAdminDashboard(userId);

        return res.status(200).json(
            new ApiResponse(200, dashboardData, "Admin dashboard data fetched successfully.")
        );
    });
}

export default new DashboardController();
