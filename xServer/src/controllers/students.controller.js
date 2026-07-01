import { asyncHandler } from "../utils/asyncHandler.js"
import studentService from '../services/student.service.js'
import { ApiResponse } from "../utils/ApiResponseHandler.js"

class studentController {

    /**
     * Student posts a doubt question — notifies mentors
     */
    studentReaseQuestion = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId || req.params.userId;
        const { specializationIdentifier, selectSessionTime } = req.query
        const { typeWriteQuestion, sessionType, scheduledTime } = req.body

        const response = await studentService.specializationMatchingByStudent(
            userId,
            specializationIdentifier,
            selectSessionTime,
            typeWriteQuestion,
            sessionType,
            scheduledTime
        );

        res.status(200).json(new ApiResponse(200, response, "Your doubt has been processed."));
    })

    /**
     * Student selects a mentor from the received offers
     */
    selectMentor = asyncHandler(async (req, res) => {
        const { doubtSessionId } = req.params
        const { selectedMentorId } = req.body
        const userId = req.user?._id || req.params.userId

        const response = await studentService.selectMentor(userId, doubtSessionId, selectedMentorId);

        const message = response?.sessionType === "scheduled"
            ? "Mentor selected successfully. Your doubt session is scheduled."
            : "Mentor selected successfully. Chat room is ready.";
        res.status(200).json(new ApiResponse(200, response, message));
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

    /**
     * Student gets list of specialist mentors (grouped by specialization category)
     * Optional query: ?specializationName=DSA to filter by specific category
     */
    listMentorsForStudent = asyncHandler(async (req, res) => {
        const userId = req.user?._id || req.user?.userId;
        const { specializationName } = req.query;
        const response = await studentService.listMentorforStudent({ userId, specializationName });
        return res.status(200).json(new ApiResponse(200, response, "Specialist mentors fetched successfully."));
    })

    /**
     * Student gets list of verified mentors for a specific specialization
     */
    getMentorsForSpecialization = asyncHandler(async (req, res) => {
        const { specializationId } = req.params;
        const response = await studentService.getMentorsForSpecialization(specializationId);
        return res.status(200).json(new ApiResponse(200, response, "Verified mentors fetched successfully."));
    })

    proposeReschedule = asyncHandler(async (req, res) => {
        const { doubtSessionId } = req.params;
        const { newScheduledTime } = req.body;
        const userId = req.user?._id || req.user?.userId;

        const response = await studentService.proposeReschedule(userId, doubtSessionId, newScheduledTime);
        res.status(200).json(new ApiResponse(200, response, "Reschedule request sent successfully."));
    })

    respondReschedule = asyncHandler(async (req, res) => {
        const { doubtSessionId } = req.params;
        const { action, reason } = req.body;
        const userId = req.user?._id || req.user?.userId;

        const response = await studentService.respondReschedule(userId, doubtSessionId, action, reason);
        res.status(200).json(new ApiResponse(200, response, `Reschedule request ${action}d.`));
    })
}

export default new studentController()
