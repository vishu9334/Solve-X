import { Router } from "express";
import { selectSpecialization, submitAssessment, replyToStudentDoubt, mentorProfile, updateMentorDescription, updateMentorProfile, getActiveAssessment } from "../controllers/mentor.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { submitAssessmentValidator, selectSpecializationValidator, replyToDoubtValidator, updateSpecializationDescriptionValidator } from "../validators/mentor.validator.js";

const router = Router();

router.get("/mentor/active-assessment", verifyAccessToken, getActiveAssessment);
router.post("/mentor/select-specialization", verifyAccessToken, validate(selectSpecializationValidator), selectSpecialization);
router.post("/mentor/submit-assessment/:attemptId", verifyAccessToken, validate(submitAssessmentValidator), submitAssessment);
router.post("/mentor/reply-doubt", verifyAccessToken, validate(replyToDoubtValidator), replyToStudentDoubt);
router.get("/mentor/profile", verifyAccessToken, mentorProfile);
router.patch("/mentor/profile", verifyAccessToken, updateMentorProfile);
router.patch("/mentor/specialization/description", verifyAccessToken, validate(updateSpecializationDescriptionValidator), updateMentorDescription);

export default router;