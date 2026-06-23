import { asyncHandler } from "../utils/asyncHandler.js"
import studentService from '../services/student.service.js'
import { ApiResponse } from "../utils/ApiResponseHandler.js"

class studentController {

    /**
     * Student posts a doubt question — notifies mentors
     */
    studentReaseQuestion = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId || req.params.userId;
        const { skillIdentifier, selectSessionTime } = req.query
        const { typeWriteQuestion } = req.body

        const response = await studentService.skillMatchingByStudent(
            userId,
            skillIdentifier,
            selectSessionTime,
            typeWriteQuestion
        );

        res.status(200).json(new ApiResponse(200, response, "Your doubt has been sent to mentors. Please wait for offers."));
    })

    /**
     * Student selects a mentor from the received offers
     */
    selectMentor = asyncHandler(async (req, res) => {
        const { doubtSessionId } = req.params
        const { selectedMentorId } = req.body
        const userId = req.user?._id || req.params.userId

        const response = await studentService.selectMentor(userId, doubtSessionId, selectedMentorId);

        res.status(200).json(new ApiResponse(200, response, "Mentor selected successfully. Chat room is ready."));
    })

    /**
     * Student ends an active doubt session manually
     */
    endSession = asyncHandler(async (req, res) => {
        const { doubtSessionId } = req.params
        const userId = req.user?._id || req.params.userId

        const response = await studentService.endSession(userId, doubtSessionId);

        res.status(200).json(new ApiResponse(200, response, "Session ended."));
    })

    studentDashBoard = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId || req.params.userId;
        const response = await studentService.studentDashboard({ userId })
        return res.status(200).json(new ApiResponse(200, response, "Student dashboard fetched success."))
    })

    updateStudentProfile = asyncHandler(async (req, res) => {
        const userId = req.user.userId
        const { bio, name, socialLinks, skills, education, preferredLanguage, timezone } = req.body

        const response = await studentService.updateStudentProfile({ userId, bio, name, socialLinks, skills, education, preferredLanguage, timezone })
        return res.status(200).json(new ApiResponse(200, response, "Profile updated successfully."))
    })

    getActiveSession = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const response = await studentService.getActiveSession(userId);
        return res.status(200).json(new ApiResponse(200, response, "Active doubt session fetched successfully."));
    })

    getDoubtSessionOffers = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const { doubtSessionId } = req.params;
        const response = await studentService.getDoubtSessionOffers(userId, doubtSessionId);
        return res.status(200).json(new ApiResponse(200, response, "Doubt session offers fetched successfully."));
    })

    getDoubtSessionDetails = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const { doubtSessionId } = req.params;
        const response = await studentService.getDoubtSessionDetails(userId, doubtSessionId);
        return res.status(200).json(new ApiResponse(200, response, "Doubt session details fetched successfully."));
    })

    getStudentProfile = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const response = await studentService.getStudentProfile({ userId });
        return res.status(200).json(new ApiResponse(200, response, "Student profile fetched successfully."));
    })
}

export default new studentController()