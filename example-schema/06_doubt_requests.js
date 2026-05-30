const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * DOUBT REQUESTS — Core entity for the student ↔ mentor matching queue
 *
 * State machine:
 *   pending → broadcasting → matched → cancelled | expired
 *
 * Design decisions:
 * - mentorBroadcastList records every mentor notified (for quality tracking)
 * - expiresAt auto-expire pending requests after a configurable window
 * - attachments supports code snippets, images, or error screenshots
 * - sessionType distinguishes instant vs scheduled at the request level
 * - Each mentor response (accept/reject/ignore) is logged per mentor
 */

// ── Sub-schema: Mentor Response Log ───────────────────────────────────────────
const MentorResponseSchema = new Schema(
  {
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    respondedAt: { type: Date },
    action: {
      type: String,
      enum: ["notified", "accepted", "rejected", "ignored", "unavailable"],
      default: "notified",
    },
    rejectionReason: { type: String, maxlength: 300, default: null },
  },
  { _id: false, timestamps: false }
);

// ── Sub-schema: Attachment ─────────────────────────────────────────────────────
const AttachmentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["image", "code_snippet", "file", "error_log"],
      required: true,
    },
    url: { type: String, required: true },
    language: { type: String, default: null }, // For code snippets
    mimeType: { type: String, default: null },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const DoubtRequestSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Doubt Details ────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Doubt title is required"],
      trim: true,
      minlength: [5, "Title too short"],
      maxlength: [200, "Title too long"],
    },
    description: {
      type: String,
      required: [true, "Doubt description is required"],
      maxlength: [5000, "Description too long"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "SkillCategory",
      required: true,
      index: true,
    },
    tags: [{ type: String, maxlength: 50 }], // e.g. ["recursion", "heap"]

    attachments: {
      type: [AttachmentSchema],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Cannot attach more than 5 files",
      },
    },

    // ─── Session Type ─────────────────────────────────────────────────────────
    sessionType: {
      type: String,
      enum: ["instant", "scheduled"],
      required: true,
      index: true,
    },

    // Only for scheduled type
    preferredSchedule: {
      date: { type: Date, default: null },
      durationMinutes: {
        type: Number,
        enum: [15, 30, 45, 60, 90, 120],
        default: 60,
      },
    },

    // ─── Matching State Machine ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "broadcasting", "matched", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    // The mentor who finally accepted
    matchedMentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    matchedAt: { type: Date, default: null },

    // Log of all mentor interactions for this request
    mentorResponses: [MentorResponseSchema],

    // Broadcast iteration count — useful for analytics / debugging
    broadcastRound: { type: Number, default: 0 },

    // Auto-expire: if not matched within window, status → expired
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min default
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-cleans expired
    },

    // Linked session (once matched)
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    // Student cancellation reason
    cancelledBy: {
      type: String,
      enum: ["student", "system"],
      default: null,
    },
    cancellationReason: { type: String, maxlength: 300, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
DoubtRequestSchema.index({ student: 1, status: 1, createdAt: -1 });
DoubtRequestSchema.index({ category: 1, status: 1, sessionType: 1 });
DoubtRequestSchema.index({ matchedMentor: 1, status: 1 });
DoubtRequestSchema.index({ "mentorResponses.mentor": 1, status: 1 });

module.exports = mongoose.model("DoubtRequest", DoubtRequestSchema);
