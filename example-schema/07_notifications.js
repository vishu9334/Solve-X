const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * NOTIFICATIONS — Multi-channel notification log
 *
 * Channels supported:
 *   - in_app   : Real-time via WebSocket / polling
 *   - whatsapp : WhatsApp Cloud API (free 1000/month tier)
 *   - email    : Transactional email (Nodemailer / SendGrid)
 *   - push     : FCM / APNS push notifications
 *
 * Design decisions:
 * - One document per notification event per recipient
 * - deliveryAttempts array supports retry logic with exponential backoff
 * - TTL index (expiresAt) auto-purges old in-app notifications after 30 days
 * - whatsapp feedback uses template IDs (BAD / GOOD / VERY GOOD options)
 * - isRead / readAt for in-app notification badge count
 */

// ── Sub-schema: Delivery Attempt ──────────────────────────────────────────────
const DeliveryAttemptSchema = new Schema(
  {
    attemptedAt: { type: Date, default: Date.now },
    channel: {
      type: String,
      enum: ["in_app", "whatsapp", "email", "push"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "failed", "bounced"],
      required: true,
    },
    providerMessageId: { type: String, default: null }, // e.g. WhatsApp msg ID
    errorMessage: { type: String, default: null },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const NotificationSchema = new Schema(
  {
    // ─── Recipient ────────────────────────────────────────────────────────────
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Type ─────────────────────────────────────────────────────────────────
    type: {
      type: String,
      required: true,
      enum: [
        // Doubt lifecycle
        "doubt_request_created",
        "doubt_request_broadcast",   // Sent to mentor community
        "doubt_request_accepted",
        "doubt_request_rejected",
        "doubt_request_expired",
        "doubt_request_cancelled",

        // Session lifecycle
        "session_scheduled",
        "session_reminder_24h",
        "session_reminder_15min",
        "session_started",
        "session_completed",
        "session_cancelled",
        "session_no_show",
        "session_extension_requested",
        "session_extension_approved",

        // Feedback
        "feedback_request_whatsapp",  // WhatsApp feedback prompt
        "feedback_received",

        // Payment
        "payment_success",
        "payment_failed",
        "payout_initiated",
        "payout_completed",

        // Mentor quality
        "mentor_rejection_warning",
        "mentor_suspended",
        "mentor_verified",

        // Platform
        "welcome",
        "subscription_expiring",
        "subscription_renewed",
        "leaderboard_updated",
        "badge_awarded",
      ],
      index: true,
    },

    // ─── Channels ─────────────────────────────────────────────────────────────
    channels: [
      {
        type: String,
        enum: ["in_app", "whatsapp", "email", "push"],
      },
    ],

    // ─── Content ──────────────────────────────────────────────────────────────
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 1000 },

    // For WhatsApp Cloud API template messages
    whatsappTemplate: {
      templateName: { type: String, default: null }, // e.g. "session_feedback"
      language: { type: String, default: "en" },
      components: { type: Schema.Types.Mixed, default: null }, // Template variables
    },

    // ─── Deep-link / Action ───────────────────────────────────────────────────
    actionUrl: { type: String, default: null }, // Frontend route
    entityType: {
      type: String,
      enum: ["session", "doubt_request", "payment", "user", null],
      default: null,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    // ─── In-App Read State ────────────────────────────────────────────────────
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },

    // ─── Delivery Log ─────────────────────────────────────────────────────────
    deliveryAttempts: [DeliveryAttemptSchema],
    overallStatus: {
      type: String,
      enum: ["pending", "delivered", "partially_delivered", "failed"],
      default: "pending",
      index: true,
    },
    nextRetryAt: { type: Date, default: null }, // For retry queue

    // ─── TTL: auto-delete after 30 days ──────────────────────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },

    // ─── Priority ─────────────────────────────────────────────────────────────
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ overallStatus: 1, nextRetryAt: 1 }); // Retry worker query
NotificationSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
