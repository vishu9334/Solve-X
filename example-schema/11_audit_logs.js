const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * AUDIT LOGS — Immutable admin action trail
 *
 * Design decisions:
 * - Documents are NEVER updated or deleted (append-only)
 * - Covers every sensitive admin/system action (suspensions, verifications,
 *   payment overrides, role changes, content moderation, etc.)
 * - before/after snapshots allow rollback analysis without needing event sourcing
 * - ipAddress + userAgent captures context for security forensics
 * - TTL: logs expire after 2 years to stay GDPR-compliant (configurable)
 * - Indexed for fast actor/entity/action-type queries on admin dashboard
 */

const AuditLogSchema = new Schema(
  {
    // ─── Actor (who did it) ───────────────────────────────────────────────────
    actor: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null, // null = system/automated action
        index: true,
      },
      role: {
        type: String,
        enum: ["admin", "superadmin", "system", "mentor", "student"],
        required: true,
      },
      email: { type: String, default: null }, // Snapshot at time of action
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
    },

    // ─── Action ───────────────────────────────────────────────────────────────
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        // User management
        "user_created",
        "user_role_changed",
        "user_suspended",
        "user_reactivated",
        "user_deleted",
        "user_email_verified",

        // Mentor actions
        "mentor_verification_approved",
        "mentor_verification_rejected",
        "mentor_skill_verified",
        "mentor_skill_unverified",
        "mentor_suspension_triggered",    // Auto by quality monitor
        "mentor_suspension_lifted",

        // Session actions
        "session_force_cancelled",
        "session_refund_issued",
        "session_extended_by_admin",

        // Payment actions
        "payment_override",
        "payout_manual_trigger",
        "subscription_granted",
        "subscription_revoked",

        // Doubt / feedback moderation
        "doubt_request_closed_by_admin",
        "feedback_removed",
        "feedback_dispute_resolved",

        // Category management
        "category_created",
        "category_updated",
        "category_deactivated",

        // Platform settings
        "platform_fee_changed",
        "leaderboard_recomputed",
        "notification_broadcast",

        // Security
        "admin_login",
        "admin_logout",
        "failed_login_attempt",
        "account_locked",
        "account_unlocked",
        "password_reset_forced",
      ],
    },

    // ─── Target Entity (what was acted upon) ──────────────────────────────────
    entity: {
      type: {
        type: String,
        enum: [
          "User",
          "MentorProfile",
          "StudentProfile",
          "Session",
          "DoubtRequest",
          "Payment",
          "Feedback",
          "SkillCategory",
          "Notification",
          "Leaderboard",
          "Platform",
        ],
        required: true,
        index: true,
      },
      id: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true,
      },
      displayName: { type: String, default: null }, // e.g. user's email
    },

    // ─── Change Snapshot ──────────────────────────────────────────────────────
    before: { type: Schema.Types.Mixed, default: null }, // State before change
    after: { type: Schema.Types.Mixed, default: null },  // State after change

    // ─── Context ──────────────────────────────────────────────────────────────
    reason: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null, // Extra data specific to action type
    },

    // ─── Severity ─────────────────────────────────────────────────────────────
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },

    // ─── TTL: auto-purge after 2 years ───────────────────────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    // No updatedAt — logs are immutable; createdAt is the only timestamp needed
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
AuditLogSchema.index({ "actor.userId": 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ "entity.type": 1, "entity.id": 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 }); // Critical alerts dashboard
AuditLogSchema.index({ "actor.ipAddress": 1, action: 1 }); // Security forensics

// ─── Guard: no updates allowed ────────────────────────────────────────────────
AuditLogSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function () {
  throw new Error("AuditLog is immutable — updates are not allowed");
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
