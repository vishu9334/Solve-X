import { Router } from "express";
import { selectSkill, submitAssessment, replyToStudentDoubt, mentorProfile, updateMentorDescription, updateMentorProfile } from "../controllers/mentor.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { submitAssessmentValidator, selectSkillValidator, replyToDoubtValidator, updateSkillDescriptionValidator } from "../validators/mentor.validator.js";

const router = Router();

router.post("/mentor/select-skill", verifyAccessToken, validate(selectSkillValidator), selectSkill);
router.post("/mentor/submit-assessment/:attemptId", verifyAccessToken, validate(submitAssessmentValidator), submitAssessment);
router.post("/mentor/reply-doubt", verifyAccessToken, validate(replyToDoubtValidator), replyToStudentDoubt);
router.get("/mentor/profile", verifyAccessToken, mentorProfile);
router.patch("/mentor/profile", verifyAccessToken, updateMentorProfile);
router.patch("/mentor/skill/description", verifyAccessToken, validate(updateSkillDescriptionValidator), updateMentorDescription);

export default router;