import { ApiResponse } from '../utils/ApiResponseHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import questionService from '../services/QNG.service.js';

const questionGenerator = asyncHandler(async(req, res)=>{
    
    const userId = req.user?._id;
    const { attemptId } = req.params;
    const { skill } = req.query;


    // if (!userId || !attemptId || !skill) {
    //     throw new ApiError(400, "userId, attemptId and skill are required");
    // }

    const questions = await questionService.generateQuestions({
        userId,
        attemptId,
        skill,
    });

    return res.status(200).json(
        new ApiResponse(
          200,
          questions,
          "Questions generated successfully"
        )
    );

});

export default questionGenerator;
