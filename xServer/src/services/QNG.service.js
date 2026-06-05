import { ApiError } from '../utils/ApiError.js';
import questionRepository from '../repositorys/implimentations/mongo.QNG.repository.js';
import { generateMCQ } from './AI/AI.service.js';

class QuestionGeneratorService {
    constructor() {
        this.questionRepository = questionRepository;
    }

    async generateQuestions(userData) {
        const { userId, attemptId, skill } = userData;

        const { user, attempt } = await this.questionRepository.findQNGRepository({
            userId,
            attemptId,
            skill
        });

        if (!user) throw new ApiError(400, "credential invalid");
        if (!attempt) throw new ApiError(404, "Attempt not found");

        // Calculate and verify number of prior attempts
        const attemptCount = attempt.attempts ? attempt.attempts.length : 0;
        if (attemptCount >= attempt.maxAttempts) {
            throw new ApiError(400, `Maximum of ${attempt.maxAttempts} assessment attempts reached`);
        }

        // Generate MCQ questions using Mistral AI
        const questions = await generateMCQ(skill);
        return questions;
    }
}

const questionService = new QuestionGeneratorService();
export default questionService;
