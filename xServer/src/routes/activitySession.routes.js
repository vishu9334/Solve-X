import { Router } from "express";
import {
  getActivitySession,
  getActivitySessionReport,
  getUserActivitySessions,
  recordActivityEvent,
  startActivitySession,
  submitActivityWindowSession,
} from "../controllers/activitySession.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  recordActivityEventValidator,
  sessionIdParamValidator,
  startActivitySessionValidator,
  submitActivityWindowSessionValidator,
  userActivitySessionsValidator,
} from "../validators/activitySession.validator.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/activity-sessions/start",             verifyAccessToken, validate(startActivitySessionValidator),   startActivitySession);
router.post("/activity-sessions/:sessionId/events", verifyAccessToken, validate(recordActivityEventValidator),    recordActivityEvent);
router.post("/activity-sessions/:sessionId/submit", verifyAccessToken, validate(submitActivityWindowSessionValidator),  submitActivityWindowSession);
router.get("/activity-sessions/user",               verifyAccessToken, validate(userActivitySessionsValidator),   getUserActivitySessions);
router.get("/activity-sessions/:sessionId/report",  verifyAccessToken, validate(sessionIdParamValidator),         getActivitySessionReport);
router.get("/activity-sessions/:sessionId",         verifyAccessToken, validate(sessionIdParamValidator),         getActivitySession);

export default router;