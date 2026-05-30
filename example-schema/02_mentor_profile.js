const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * MENTOR PROFILE — Extended profile for mentor role users
 *
 * Design decisions:
 * - Separate from User to keep User lean; 1-to-1 with User via userId
 * - verificationStatus has its own state machine
 * - skills array links to SkillCategory with per-skill verification
 * - availability stores weekly schedule for scheduled sessions
 * - earnings is denormalized snapshot updated on each payment settlement
 * - rejectionCount triggers quality monitoring alerts
 */

// ── Sub-schema: Availability Slot ─────────────────────────────────────────────
const AvailabilitySlotSchema = new Schema(
  {
    dayOfWeek: {
      type: Number,
      min: 0, // 0 = Sunday
      max: 6, // 6 = Saturday
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM format"],
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Sub-schema: Mentor Skill Entry ────────────────────────────────────────────
const MentorSkillSchema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "SkillCategory",
      required: true,
    },
    proficiencyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "intermediate",
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // Admin who verified
    },
  },
  { _id: false }
);

// ── Sub-schema: Camera Verification ───────────────────────────────────────────
const VerificationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["not_started", "pending", "approved", "rejected", "expired"],
      default: "not_started",
    },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Stored reference to ID document / selfie video
    idDocumentUrl: { type: String, default: null },
    selfieVideoUrl: { type: String, default: null },
    rejectionReason: { type: String, default: null, maxlength: 500 },
    attemptCount: { type: Number, default: 0 }, // Limit re-submission attempts
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const MentorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ─── Bio ─────────────────────────────────────────────────────────────────
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      default: "",
    },
    tagline: { type: String, maxlength: 150, default: "" },
    yearsOfExperience: { type: Number, min: 0, max: 60, default: 0 },

    // ─── Skills & Verification ───────────────────────────────────────────────
    skills: {
      type: [MentorSkillSchema],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: "Cannot add more than 20 skills",
      },
    },
    cameraVerification: { type: VerificationSchema, default: () => ({}) },

    // Overall mentor approval status (separate from camera verification)
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
      index: true,
    },

    // ─── Availability ────────────────────────────────────────────────────────
    isAvailableNow: { type: Boolean, default: false, index: true }, // For instant sessions
    weeklyAvailability: [AvailabilitySlotSchema],

    // Buffer time (minutes) between sessions
    sessionBufferMinutes: { type: Number, default: 10, min: 0, max: 60 },

    // ─── Session Preferences ─────────────────────────────────────────────────
    preferredSessionDuration: {
      type: Number,
      enum: [15, 30, 45, 60, 90, 120], // minutes
      default: 60,
    },
    maxConcurrentStudents: { type: Number, default: 1, min: 1, max: 5 },

    // ─── Earnings (Denormalized Snapshot) ────────────────────────────────────
    earnings: {
      totalEarned: { type: Number, default: 0, min: 0 },       // All-time gross
      platformFeeDeducted: { type: Number, default: 0, min: 0 }, // Platform's cut
      pendingPayout: { type: Number, default: 0, min: 0 },      // Not yet paid out
      lastPayoutAt: { type: Date, default: null },
      bankDetails: {
        accountHolder: { type: String, default: null },
        accountNumber: { type: String, default: null, select: false },
        ifscCode: { type: String, default: null, select: false },
        upiId: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
      },
    },

    // ─── Quality Monitoring ──────────────────────────────────────────────────
    stats: {
      totalSessionsCompleted: { type: Number, default: 0 },
      totalSessionsRejected: { type: Number, default: 0 },
      consecutiveRejections: { type: Number, default: 0 }, // Reset on acceptance
      totalStudentsHelped: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatingsCount: { type: Number, default: 0 },
      responseTimeAvgMinutes: { type: Number, default: 0 },
    },

    // ─── Gamification ────────────────────────────────────────────────────────
    badges: [
      {
        badgeType: {
          type: String,
          enum: [
            "top_mentor",
            "fast_responder",
            "expert_dsa",
            "community_hero",
            "rising_star",
          ],
        },
        awardedAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Soft fields ─────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
MentorProfileSchema.index({ approvalStatus: 1, isAvailableNow: 1 });
MentorProfileSchema.index({ "skills.category": 1, "skills.isVerified": 1 });
MentorProfileSchema.index({ "stats.averageRating": -1 });
MentorProfileSchema.index({ "stats.consecutiveRejections": 1 }); // Quality alerts

// ─── Virtual ──────────────────────────────────────────────────────────────────
MentorProfileSchema.virtual("isQualityFlagged").get(function () {
  return this.stats.consecutiveRejections >= 5;
});

module.exports = mongoose.model("MentorProfile", MentorProfileSchema);
