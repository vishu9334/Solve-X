const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * SESSIONS — Full lifecycle of a mentor-student session
 *
 * State machine:
 *   scheduled → waiting_to_start → live → completed | cancelled | no_show
 *
 * Design decisions:
 * - Supports both instant and scheduled sessions
 * - toolConfig stores the chosen communication/coding tools per session
 * - timeline array is an append-only event log (joined, left, paused, etc.)
 * - recordingUrl stored after session ends (if recording enabled)
 * - actualDurationMinutes vs plannedDurationMinutes for billing accuracy
 * - noShowBy tracks which party didn't show up (mentor / student)
 */

// ── Sub-schema: Tool Configuration ────────────────────────────────────────────
const ToolConfigSchema = new Schema(
  {
    communicationMode: {
      type: String,
      enum: ["video", "audio", "chat", "video_and_chat", "audio_and_chat"],
      default: "video_and_chat",
    },
    codingTool: {
      type: String,
      enum: [
        "none",
        "live_share",     // VS Code Live Share
        "replit",
        "codepen",
        "codesandbox",
        "google_meet",
        "zoom",
        "platform_whiteboard",
      ],
      default: "none",
    },
    meetingLink: { type: String, default: null }, // External meet/zoom link
    roomId: { type: String, default: null },       // Internal room ID
  },
  { _id: false }
);

// ── Sub-schema: Timeline Event ────────────────────────────────────────────────
const TimelineEventSchema = new Schema(
  {
    event: {
      type: String,
      enum: [
        "created",
        "student_joined",
        "mentor_joined",
        "paused",
        "resumed",
        "student_left",
        "mentor_left",
        "completed",
        "cancelled",
        "no_show_student",
        "no_show_mentor",
        "extended",
      ],
      required: true,
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    at: { type: Date, default: Date.now },
    note: { type: String, maxlength: 300, default: null },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const SessionSchema = new Schema(
  {
    // ─── Parties ──────────────────────────────────────────────────────────────
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Source Doubt Request ─────────────────────────────────────────────────
    doubtRequest: {
      type: Schema.Types.ObjectId,
      ref: "DoubtRequest",
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "SkillCategory",
      required: true,
    },

    // ─── Session Type ─────────────────────────────────────────────────────────
    sessionType: {
      type: String,
      enum: ["instant", "scheduled"],
      required: true,
    },

    // ─── Timing ───────────────────────────────────────────────────────────────
    scheduledAt: { type: Date, default: null }, // For scheduled sessions
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },

    plannedDurationMinutes: {
      type: Number,
      enum: [15, 30, 45, 60, 90, 120],
      default: 60,
    },
    actualDurationMinutes: { type: Number, default: 0, min: 0 },

    // Extension requests during live session
    extensions: [
      {
        requestedBy: { type: String, enum: ["student", "mentor"] },
        extraMinutes: { type: Number, min: 5, max: 60 },
        approvedAt: { type: Date, default: null },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
      },
    ],

    // ─── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "scheduled",
        "waiting_to_start",
        "live",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
      index: true,
    },

    noShowBy: {
      type: String,
      enum: ["student", "mentor", null],
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["student", "mentor", "admin", "system", null],
      default: null,
    },
    cancellationReason: { type: String, maxlength: 500, default: null },

    // ─── Tools ────────────────────────────────────────────────────────────────
    toolConfig: { type: ToolConfigSchema, default: () => ({}) },

    // ─── Recording ────────────────────────────────────────────────────────────
    isRecordingEnabled: { type: Boolean, default: false },
    recordingUrl: { type: String, default: null },
    recordingExpiresAt: { type: Date, default: null }, // Auto-delete after 30 days

    // ─── Event Log ────────────────────────────────────────────────────────────
    timeline: [TimelineEventSchema],

    // ─── Feedback & Payment Links ─────────────────────────────────────────────
    feedback: {
      type: Schema.Types.ObjectId,
      ref: "Feedback",
      default: null,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // ─── Notes ────────────────────────────────────────────────────────────────
    mentorNotes: {
      type: String,
      maxlength: 2000,
      default: null,
      select: false, // Only accessible if explicitly requested
    },
    sessionSummary: { type: String, maxlength: 1000, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
SessionSchema.index({ student: 1, status: 1, createdAt: -1 });
SessionSchema.index({ mentor: 1, status: 1, createdAt: -1 });
SessionSchema.index({ status: 1, scheduledAt: 1 }); // Upcoming session queries
SessionSchema.index({ category: 1, status: 1 });
SessionSchema.index({ "toolConfig.roomId": 1 });

// ─── Virtual: Was session fully completed? ────────────────────────────────────
SessionSchema.virtual("isCompleted").get(function () {
  return this.status === "completed" && this.actualDurationMinutes > 0;
});

module.exports = mongoose.model("Session", SessionSchema);
