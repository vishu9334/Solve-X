import { ApiError } from "../utils/ApiError.js";
import {
  computeActivityDecision,
  getEventSeverity,
  getFlagUpdate,
} from "../helpers/activitySession.helper.js";

class ActivitySession {
  #doc; // private — bahar se directly access nahi hoga

  constructor(sessionDoc) {
    this.#doc = sessionDoc;
  }

  // ─── Guards ───────────────────────────────────────────

  isEnded() {
    return !!this.#doc.endedAt;
  }

  // ─── Behavior ─────────────────────────────────────────

  addEvent(eventData) {
    if (this.isEnded()) return;

    const event = this.#createEvent(eventData);
    const flagUpdate = getFlagUpdate(event.eventType);

    this.#doc.events.push(event);
    this.#doc.totalEvents += 1;

    if (event.severity === "warning") this.#doc.warningCount += 1;
    if (event.severity === "critical") this.#doc.criticalCount += 1;

    Object.assign(this.#doc, flagUpdate);

    this.#updateDecision();

    if (this.#shouldAutoSubmit() && event.eventType !== "TEST_SUBMITTED") {
      this.submit({
        message: "Auto-submitted: excessive warnings",
        metadata: { autoSubmitted: true }
      });
    }
  }

  submit(eventData = {}) {
    if (this.isEnded()) return;
    this.addEvent({
      eventType: "TEST_SUBMITTED",
      message: "Assessment submitted",
      ...eventData,
    });
    this.#doc.endedAt = new Date();
    this.#updateDecision();
  }

  getReport() {
    const doc = this.#doc;

    const eventBreakdown = doc.events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      sessionId: doc._id,
      user: doc.userId,
      category: doc.category,
      startedAt: doc.startedAt,
      endedAt: doc.endedAt,
      duration: doc.endedAt
        ? Math.round((new Date(doc.endedAt) - new Date(doc.startedAt)) / 1000)
        : null,
      totalEvents: doc.totalEvents,
      warningCount: doc.warningCount,
      criticalCount: doc.criticalCount,
      hasTabSwitch: doc.hasTabSwitch,
      hasFullscreenExit: doc.hasFullscreenExit,
      hasScreenResize: doc.hasScreenResize,
      hasPageClose: doc.hasPageClose,
      activityDecision: doc.activityDecision,
      activityRejectReason: doc.activityRejectReason,
      eventBreakdown,
      events: doc.events,
    };
  }

  // ─── Persistence ──────────────────────────────────────

  async save() {
    return this.#doc.save();
  }

  toDocument() {
    return this.#doc;
  }

  // ─── Private helpers ──────────────────────────────────

  #createEvent({ eventType, message, screen = {}, metadata = {}, occurredAt }) {
    if (!eventType) throw new ApiError(400, "eventType is required");

    return {
      eventType,
      severity: getEventSeverity(eventType),
      message: message ?? eventType.replace(/_/g, " ").toLowerCase(),
      screen: screen ?? {},
      metadata: metadata ?? {},
      occurredAt: occurredAt || new Date(),
    };
  }

  #updateDecision() {
    const { decision, reason } = computeActivityDecision(this.#doc);
    this.#doc.activityDecision = decision;
    this.#doc.activityRejectReason = reason;
  }

  #shouldAutoSubmit() {
    return this.#doc.warningCount >= 3;
  }
}

export default ActivitySession;