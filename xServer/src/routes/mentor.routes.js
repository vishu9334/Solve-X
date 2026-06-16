import { Router } from "express";
import { selectSkill, submitAssessment, replyToStudentDoubt } from "../controllers/mentor.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { submitAssessmentValidator } from "../validators/mentor.validator.js";

const router = Router();

router.post("/mentor/select-skill", verifyAccessToken, selectSkill);
router.post("/mentor/submit-assessment", verifyAccessToken, validate(submitAssessmentValidator), submitAssessment);
router.post("/mentor/reply-doubt", verifyAccessToken, replyToStudentDoubt);

export default router;