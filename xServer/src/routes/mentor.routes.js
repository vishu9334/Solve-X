import { Router } from "express";
import { 
    selectSpecialization, 
    submitAssessment, 
    replyToStudentDoubt, 
    mentorProfile, 
    updateMentorDescription, 
    updateMentorProfile, 
    getActiveAssessment, 
    proposeReschedule, 
    rejectScheduledDoubt,
    acceptDoubtRequest
} from "../controllers/mentor.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    submitAssessmentValidator, 
    selectSpecializationValidator, 
    replyToDoubtValidator, 
    updateSpecializationDescriptionValidator, 
    rejectScheduledDoubtValidator 
} from "../validators/mentor.validator.js";

const router = Router();

router.get("/mentor/active-assessment", verifyAccessToken, getActiveAssessment);
router.post("/mentor/select-specialization", verifyAccessToken, validate(selectSpecializationValidator), selectSpecialization);
router.post("/mentor/submit-assessment/:attemptId", verifyAccessToken, validate(submitAssessmentValidator), submitAssessment);
router.post("/mentor/reply-doubt", verifyAccessToken, validate(replyToDoubtValidator), replyToStudentDoubt);
router.get("/mentor/profile", verifyAccessToken, mentorProfile);
router.patch("/mentor/profile", verifyAccessToken, updateMentorProfile);
router.patch("/mentor/specialization/description", verifyAccessToken, validate(updateSpecializationDescriptionValidator), updateMentorDescription);
router.post("/mentor/accept-doubt/:doubtId", verifyAccessToken, acceptDoubtRequest);

// Mentor reschedule request
router.post("/mentor/sessions/:doubtSessionId/reschedule-request", verifyAccessToken, proposeReschedule);

// Mentor reject/cancel confirmed scheduled doubt
router.post("/mentor/sessions/:doubtSessionId/reject", verifyAccessToken, validate(rejectScheduledDoubtValidator), rejectScheduledDoubt);

export default router;