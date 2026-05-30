const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * LEADERBOARD — Mentor rankings & gamification
 *
 * Design decisions:
 * - One document per mentor per period (weekly/monthly/all-time)
 *   → Easy to compute "This Week's Top 10" without heavy aggregation
 * - scores sub-doc holds component scores; compositeScore is the ranked value
 * - rankChange captures rank movement vs previous period (for trending badges)
 * - Snapshots are computed by a background cron job (e.g. every Sunday midnight)
 * - TTL on weekly/monthly docs keeps collection lean
 * - Separate BadgeAward collection cross-references leaderboard events
 */

// ── Sub-schema: Score Breakdown ───────────────────────────────────────────────
const ScoreBreakdownSchema = new Schema(
  {
    // Each dimension weighted differently in compositeScore
    avgRating: { type: Number, default: 0, min: 0, max: 5 },         // weight 40%
    totalSessions: { type: Number, default: 0, min: 0 },              // weight 20%
    responseRate: { type: Number, default: 0, min: 0, max: 100 },     // weight 20%
    studentRetentionRate: { type: Number, default: 0, min: 0, max: 100 }, // weight 10%
    feedbackQualityScore: { type: Number, default: 0, min: 0, max: 5 },   // weight 10%
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const LeaderboardSchema = new Schema(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Period ───────────────────────────────────────────────────────────────
    period: {
      type: String,
      enum: ["weekly", "monthly", "all_time"],
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    // ─── Category Scope ───────────────────────────────────────────────────────
    // null = global leaderboard; ObjectId = category-specific leaderboard
    category: {
      type: Schema.Types.ObjectId,
      ref: "SkillCategory",
      default: null,
      index: true,
    },

    // ─── Scores ───────────────────────────────────────────────────────────────
    scores: { type: ScoreBreakdownSchema, default: () => ({}) },

    compositeScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true, // Sorted queries on this field
    },

    // ─── Rank ─────────────────────────────────────────────────────────────────
    rank: { type: Number, default: null },        // 1-based position
    previousRank: { type: Number, default: null }, // Rank from last period
    rankChange: { type: Number, default: 0 },      // positive = improved, negative = dropped

    // ─── Badges Earned This Period ────────────────────────────────────────────
    badgesEarnedThisPeriod: [
      {
        type: String,
        enum: [
          "top_mentor",
          "fast_responder",
          "expert_dsa",
          "community_hero",
          "rising_star",
          "most_sessions",
          "perfect_rating",
        ],
      },
    ],

    // ─── Snapshot Metadata ───────────────────────────────────────────────────
    computedAt: { type: Date, default: Date.now },

    // Auto-expire weekly/monthly docs after 90 days (keep all_time indefinitely)
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 }, // TTL — only effective when expiresAt is set
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Compound Indexes ──────────────────────────────────────────────────────────
LeaderboardSchema.index({ period: 1, category: 1, compositeScore: -1 }); // Top-N query
LeaderboardSchema.index({ period: 1, category: 1, rank: 1 });             // Paginated rank
LeaderboardSchema.index(
  { mentor: 1, period: 1, category: 1, periodStart: 1 },
  { unique: true }
); // One record per mentor per period per category

// ─── Virtual: is this mentor in top 10? ──────────────────────────────────────
LeaderboardSchema.virtual("isTopTen").get(function () {
  return this.rank !== null && this.rank <= 10;
});

// ─── Static: compute & upsert leaderboard for a period ───────────────────────
LeaderboardSchema.statics.computeForPeriod = async function ({
  period,
  periodStart,
  periodEnd,
  category = null,
}) {
  // This stub is called by the background cron job.
  // Implementation aggregates Session + Feedback + MentorProfile collections.
  throw new Error("computeForPeriod must be implemented in service layer");
};

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
