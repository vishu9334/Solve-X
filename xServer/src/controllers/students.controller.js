import { asyncHandler } from "../utils/asyncHandler.js"
import studentService from '../services/student.service.js'
import { ApiResponse } from "../utils/ApiResponseHandler.js"

class studentController {

    /**
     * Student posts a doubt question — notifies mentors
     */
    studentReaseQuestion = asyncHandler(async (req, res) => {
        const { userId } = req.params
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
}

export default new studentController()