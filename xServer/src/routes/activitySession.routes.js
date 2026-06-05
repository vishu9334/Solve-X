import { Router } from "express";
import {
  getActivitySession,
  getActivitySessionReport,
  getUserActivitySessions,
  recordActivityEvent,
  startActivitySession,
  submitActivitySession,
} from "../controllers/activitySession.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  recordActivityEventValidator,
  sessionIdParamValidator,
  startActivitySessionValidator,
  submitActivitySessionValidator,
  userActivitySessionsValidator,
} from "../validators/activitySession.validator.js";

const router = Router();

router.post("/start", validate(startActivitySessionValidator), startActivitySession);
router.post("/:sessionId/events", validate(recordActivityEventValidator), recordActivityEvent);
router.post("/:sessionId/submit", validate(submitActivitySessionValidator), submitActivitySession);
router.get("/user/:userId", validate(userActivitySessionsValidator), getUserActivitySessions);
router.get("/:sessionId/report", validate(sessionIdParamValidator), getActivitySessionReport);
router.get("/:sessionId", validate(sessionIdParamValidator), getActivitySession);

export default router;
