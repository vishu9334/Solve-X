import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import activitySessionService from "../services/SActivitysession.service.js";

export const startActivitySession = asyncHandler(async (req, res) => {
  const userId = req.user.userId; 
  const { category, screen, metadata } = req.body;

  const session = await activitySessionService.startSession({
    userId,
    category,
    screen,
    metadata,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, session, "Activity session started successfully"));
});

export const recordActivityEvent = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId; // ✅

  const session = await activitySessionService.recordEvent(sessionId, userId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity event recorded successfully"));
});

export const submitActivitySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId; 

  const session = await activitySessionService.submitSession(sessionId, userId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity session submitted successfully"));
});

export const getActivitySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId; // ✅

  const session = await activitySessionService.getSessionById(sessionId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity session fetched successfully"));
});

export const getUserActivitySessions = asyncHandler(async (req, res) => {
  const userId = req.user.userId; // ✅
  const { category } = req.query;

  const sessions = await activitySessionService.getSessionsByUser({
    userId,
    category,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, sessions, "Activity sessions fetched successfully"));
});

export const getActivitySessionReport = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId; // ✅

  const report = await activitySessionService.getSessionReport(sessionId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Activity session report fetched successfully"));
});