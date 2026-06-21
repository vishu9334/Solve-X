import { Router } from "express";
import studentController from "../controllers/students.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Student posts a doubt question — notifies all matched mentors
router.post("/student/ask-doubt", verifyAccessToken, studentController.studentReaseQuestion);
router.post("/student/ask-doubt/:userId", verifyAccessToken, studentController.studentReaseQuestion);

// Student selects a mentor from the received offers
router.post("/student/select-mentor/:doubtSessionId", verifyAccessToken, studentController.selectMentor);

// Student ends an active doubt session manually
router.post("/student/end-session/:doubtSessionId", verifyAccessToken, studentController.endSession);

// Student dashboard — profile + sessions + stats
router.get("/student/dashboard", verifyAccessToken, studentController.studentDashBoard);
router.get("/student/dashboard/:userId", verifyAccessToken, studentController.studentDashBoard);

// Student updates bio and/or name
router.patch("/student/profile", verifyAccessToken, studentController.updateStudentProfile);

// Student gets active doubt session
router.get("/student/active-session", verifyAccessToken, studentController.getActiveSession);

// Student gets all offers for a specific doubt session
router.get("/student/doubt-sessions/:doubtSessionId/offers", verifyAccessToken, studentController.getDoubtSessionOffers);

// Student gets details of a specific doubt session
router.get("/student/doubt-sessions/:doubtSessionId", verifyAccessToken, studentController.getDoubtSessionDetails);

export default router;
