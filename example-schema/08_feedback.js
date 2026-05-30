const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * FEEDBACK — Post-session ratings submitted by students
 *
 * Design decisions:
 * - WhatsApp feedback uses quick-reply buttons: BAD / GOOD / VERY GOOD
 *   (maps to numeric scores 1 / 3 / 5 for simplicity)
 * - detailedRating has sub-scores (communication, knowledge, punctuality)
 *   so mentors get actionable insight beyond a single star
 * - isPublic controls whether feedback shows on mentor's public profile
 * - mentorResponse allows mentor to reply to feedback (like Google reviews)
 * - isEdited + editHistory preserve original for audit
 * - adminReview handles flagged / disputed feedback
 */

// ── Sub-schema: Edit History ───────────────────────────────────────────────────
const EditHistorySchema = new Schema(
  {
    previousRating: { type: Number },
    previousComment: { type: String },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const FeedbackSchema = new Schema(
  {
    // ─── Parties & Session ────────────────────────────────────────────────────
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true, // Exactly one feedback per session
      index: true,
    },
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

    // ─── WhatsApp Quick-Reply Score ───────────────────────────────────────────
    // BAD=1, GOOD=3, VERY_GOOD=5 — sent via WhatsApp Cloud API template
    quickRating: {
      type: String,
      enum: ["BAD", "GOOD", "VERY_GOOD"],
      default: null,
    },
    quickRatingScore: {
      type: Number,
      enum: [1, 3, 5],
      default: null,
    },

    // ─── Detailed Rating (in-app, optional follow-up) ─────────────────────────
    overallRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
      default: null,
    },
    detailedRating: {
      communication: { type: Number, min: 1, max: 5, default: null },
      knowledgeDepth: { type: Number, min: 1, max: 5, default: null },
      punctuality: { type: Number, min: 1, max: 5, default: null },
      helpfulness: { type: Number, min: 1, max: 5, default: null },
    },

    comment: {
      type: String,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      default: "",
      trim: true,
    },

    // ─── Feedback Source ──────────────────────────────────────────────────────
    submittedVia: {
      type: String,
      enum: ["whatsapp", "in_app", "email"],
      default: "in_app",
    },

    // ─── Visibility ───────────────────────────────────────────────────────────
    isPublic: { type: Boolean, default: true },

    // ─── Mentor Reply ─────────────────────────────────────────────────────────
    mentorResponse: {
      text: { type: String, maxlength: 500, default: null },
      respondedAt: { type: Date, default: null },
    },

    // ─── Edit Tracking ────────────────────────────────────────────────────────
    isEdited: { type: Boolean, default: false },
    editHistory: {
      type: [EditHistorySchema],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "Cannot edit feedback more than 3 times",
      },
    },

    // ─── Admin / Moderation ──────────────────────────────────────────────────
    isFlagged: { type: Boolean, default: false, index: true },
    flaggedReason: { type: String, maxlength: 300, default: null },
    adminReview: {
      status: {
        type: String,
        enum: ["pending", "approved", "removed", "disputed"],
        default: "approved",
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, default: null },
      note: { type: String, maxlength: 500, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
FeedbackSchema.index({ mentor: 1, overallRating: -1 });
FeedbackSchema.index({ mentor: 1, isPublic: 1, createdAt: -1 });
FeedbackSchema.index({ isFlagged: 1, "adminReview.status": 1 });

// ─── Virtual: effective rating (prefer detailed over quick) ──────────────────
FeedbackSchema.virtual("effectiveRating").get(function () {
  return this.overallRating ?? this.quickRatingScore ?? null;
});

// ─── Pre-save: sync quickRatingScore from quickRating string ─────────────────
FeedbackSchema.pre("save", function (next) {
  const map = { BAD: 1, GOOD: 3, VERY_GOOD: 5 };
  if (this.quickRating) {
    this.quickRatingScore = map[this.quickRating];
    if (!this.overallRating) this.overallRating = this.quickRatingScore;
  }
  next();
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
