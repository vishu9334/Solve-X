import { ApiError } from "../utils/ApiError.js";
import activitySessionRepository from "../repositorys/implimentations/mongo.activitySession.repository.js";
import ActivitySession from "../domain/DActivitysession.domain.js";
import mongoose from "mongoose";
import { Skill } from "../models/skill.model.js";
import { MentorProfile } from "../models/AmentorProfile.model.js";

class ActivitySessionService {
  constructor() {
    this.activitySessionRepository = activitySessionRepository;
  }

  // ─── Start ────────────────────────────────────────────

  async startSession({ userId, category, screen = {}, metadata = {} }) {
    if (!userId || !category) {
      throw new ApiError(400, "userId and category are required");
    }

    // Resolve assessmentId from Skill category (could be ID, name, or slug)
    let skill = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      skill = await Skill.findById(category);
    } else {
      skill = await Skill.findOne({
        $or: [{ name: category }, { slug: category.toLowerCase() }]
      });
    }

    if (!skill) {
      const profile = await MentorProfile.findOne({ userId });
      if (profile && profile.skillCategory) {
        skill = await Skill.findById(profile.skillCategory);
      }
    }

    if (!skill || !skill.assessmentId) {
      throw new ApiError(400, "No active assessment linked to this category.");
    }

    const startedAt = new Date();

    const sessionDoc = await this.activitySessionRepository.createSession({
      userId,
      category,
      assessmentId: skill.assessmentId,
      startedAt,
      totalEvents: 1,
      events: [
        {
          eventType: "TEST_STARTED",
          message: "Assessment session started",
          screen,
          metadata,
          occurredAt: startedAt,
        },
      ],
    });

    return sessionDoc;
  }

  // ─── Record Event ─────────────────────────────────────

  async recordEvent(sessionId, userId, eventData) {
    if (!sessionId) throw new ApiError(400, "sessionId is required");

    const doc = await this.activitySessionRepository.findSessionByIdAndUser(sessionId, userId);
    if (!doc) throw new ApiError(404, "Session not found or unauthorized.");

    const session = new ActivitySession(doc); // class instance

    if (session.isEnded()) throw new ApiError(400, "Activity session is already ended.");

    // Enforce time limit check
    const { AssessmentStore } = await import("../models/assessmentDataStore.model.js");
    const assessment = await AssessmentStore.findById(doc.assessmentId);
    const limitMinutes = assessment?.durationMinutes || 15;
    const elapsedMs = new Date() - new Date(doc.startedAt);
    const elapsedMinutes = elapsedMs / (1000 * 60);

    if (elapsedMinutes > limitMinutes) {
      session.submit({
        eventType: "TIME_EXPIRED",
        message: "Time limit expired",
        metadata: { timeExpired: true }
      });
    } else {
      session.addEvent(eventData); // class method
    }

    const savedDoc = await session.save();       // class method

    if (session.isEnded() && eventData.eventType !== "TEST_SUBMITTED") {
      const { default: mentorService } = await import("./mentor.service.js");
      await mentorService.handleAutoSubmit(userId, sessionId, savedDoc);
    }

    return savedDoc;
  }

  // ─── Submit ───────────────────────────────────────────

  async submitSession(sessionId, userId, eventData = {}) {
    if (!sessionId) throw new ApiError(400, "sessionId is required");

    const doc = await this.activitySessionRepository.findSessionByIdAndUser(sessionId, userId);
    if (!doc) throw new ApiError(404, "Session not found or unauthorized.");

    const session = new ActivitySession(doc); //class instance

    if (session.isEnded()) throw new ApiError(400, "Activity session is already ended.");

    session.submit(eventData); // class method — submit + decision andar hoga
    return session.save();     // class method
  }

  // ─── Get Session ──────────────────────────────────────

  async getSessionById(sessionId, userId) {
    if (!sessionId) throw new ApiError(400, "sessionId is required");

    const doc = await this.activitySessionRepository.findSessionByIdAndUser(sessionId, userId);
    if (!doc) throw new ApiError(404, "Session not found or unauthorized.");

    return doc;
  }

  // ─── Get User Sessions ────────────────────────────────

  async getSessionsByUser({ userId, category }) {
    if (!userId) throw new ApiError(400, "userId is required");

    const query = { userId };
    if (category) query.category = category;

    return this.activitySessionRepository.findSessionsByUser(query);
  }

  // ─── Get Report ───────────────────────────────────────

  async getSessionReport(sessionId, userId) {
    if (!sessionId) throw new ApiError(400, "sessionId is required");

    const doc = await this.activitySessionRepository.findSessionByIdAndUser(sessionId, userId);
    if (!doc) throw new ApiError(404, "Session not found or unauthorized.");

    const session = new ActivitySession(doc); // class instance
    return session.getReport();               // class method
  }
}

const activitySessionService = new ActivitySessionService();
export default activitySessionService;