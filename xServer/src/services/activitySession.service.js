import { ApiError } from "../utils/ApiError.js";
import activitySessionRepository from "../repositorys/implimentations/mongo.activitySession.repository.js";
import {
  computeActivityDecision,
  getEventSeverity,
  getFlagUpdate,
} from "../helpers/activitySession.helper.js";

class ActivitySessionService {
  constructor() {
    this.activitySessionRepository = activitySessionRepository;
  }

  async startSession({ userId, category, screen = {}, metadata = {} }) {
    if (!userId || !category) {
      throw new ApiError(400, "userId and category are required");
    }

    const startedAt = new Date();
    const event = this.createEvent({
      eventType: "TEST_STARTED",
      message: "Assessment session started",
      screen,
      metadata,
      occurredAt: startedAt,
    });

    return this.activitySessionRepository.createSession({
      userId,
      category,
      startedAt,
      totalEvents: 1,
      events: [event],
    });
  }

  async recordEvent(sessionId, eventData) {
    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }

    const session = await this.activitySessionRepository.findSessionById(sessionId);

    if (!session) {
      throw new ApiError(404, "Activity session not found");
    }

    if (session.endedAt) {
      throw new ApiError(400, "Activity session is already ended");
    }

    this.applyEventToSession(session, eventData);

    return this.activitySessionRepository.saveSession(session);
  }

  async submitSession(sessionId, eventData = {}) {
    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }

    const session = await this.activitySessionRepository.findSessionById(sessionId);

    if (!session) {
      throw new ApiError(404, "Activity session not found");
    }

    if (!session.endedAt) {
      this.applyEventToSession(session, {
        eventType: "TEST_SUBMITTED",
        message: "Assessment submitted",
        ...eventData,
      });
      session.endedAt = new Date();
    } else {
      throw new ApiError(400, "Activity session is already ended");
    }

    const { decision, reason } = computeActivityDecision(session);
    session.activityDecision = decision;
    session.activityRejectReason = reason;

    return this.activitySessionRepository.saveSession(session);
  }

  async getSessionById(sessionId) {
    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }

    const session = await this.activitySessionRepository.findSessionByIdWithUser(sessionId);

    if (!session) {
      throw new ApiError(404, "Activity session not found");
    }

    return session;
  }

  async getSessionsByUser({ userId, category }) {
    if (!userId) {
      throw new ApiError(400, "userId is required");
    }

    const query = { userId };
    if (category) query.category = category;

    return this.activitySessionRepository.findSessionsByUser(query);
  }

  async getSessionReport(sessionId) {
    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }

    const session = await this.activitySessionRepository.findSessionReportById(sessionId);

    if (!session) {
      throw new ApiError(404, "Activity session not found");
    }

    const eventBreakdown = session.events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      sessionId: session._id,
      user: session.userId,
      category: session.category,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.endedAt
        ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000)
        : null,
      totalEvents: session.totalEvents,
      warningCount: session.warningCount,
      criticalCount: session.criticalCount,
      hasTabSwitch: session.hasTabSwitch,
      hasFullscreenExit: session.hasFullscreenExit,
      hasScreenResize: session.hasScreenResize,
      hasPageClose: session.hasPageClose,
      activityDecision: session.activityDecision,
      activityRejectReason: session.activityRejectReason,
      eventBreakdown,
      events: session.events,
    };
  }

  createEvent({ eventType, message, screen = {}, metadata = {}, occurredAt }) {
    if (!eventType) {
      throw new ApiError(400, "eventType is required");
    }

    return {
      eventType,
      severity: getEventSeverity(eventType),
      message: message ?? eventType.replace(/_/g, " ").toLowerCase(),
      screen: screen ?? {},
      metadata: metadata ?? {},
      occurredAt: occurredAt || new Date(),
    };
  }

  applyEventToSession(session, eventData) {
    const event = this.createEvent(eventData);
    const flagUpdate = getFlagUpdate(event.eventType);

    session.events.push(event);
    session.totalEvents += 1;

    if (event.severity === "warning") {
      session.warningCount += 1;
    }

    if (event.severity === "critical") {
      session.criticalCount += 1;
    }

    Object.assign(session, flagUpdate);

    const { decision, reason } = computeActivityDecision(session);
    session.activityDecision = decision;
    session.activityRejectReason = reason;
  }
}

const activitySessionService = new ActivitySessionService();
export default activitySessionService;
