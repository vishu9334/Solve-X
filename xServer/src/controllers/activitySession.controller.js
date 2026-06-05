import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import activitySessionService from "../services/activitySession.service.js";

export const startActivitySession = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.body.userId;
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

  const session = await activitySessionService.recordEvent(sessionId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity event recorded successfully"));
});

export const submitActivitySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await activitySessionService.submitSession(sessionId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity session submitted successfully"));
});

export const getActivitySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await activitySessionService.getSessionById(sessionId);

  return res
    .status(200)
    .json(new ApiResponse(200, session, "Activity session fetched successfully"));
});

export const getUserActivitySessions = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.params.userId;
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

  const report = await activitySessionService.getSessionReport(sessionId);

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Activity session report fetched successfully"));
});
