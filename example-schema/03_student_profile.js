const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * STUDENT PROFILE — Extended profile for student users
 *
 * Design decisions:
 * - learningGoals links to SkillCategory for structured goal tracking
 * - subscriptionPlan captures the active plan; plan history is in Payments
 * - sessionCredits for pre-paid session bundles
 * - preferredTools tracks coding tool preferences per session type
 */

const StudentProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ─── Education & Background ───────────────────────────────────────────────
    educationLevel: {
      type: String,
      enum: [
        "high_school",
        "undergraduate",
        "postgraduate",
        "working_professional",
        "other",
      ],
      default: "undergraduate",
    },

    institution: { type: String, maxlength: 150, default: "" },

    // Graduation year — useful for student targeting
    graduationYear: {
      type: Number,
      min: 2000,
      max: 2040,
      default: null,
    },

    // ─── Learning Goals ───────────────────────────────────────────────────────
    learningGoals: [
      {
        category: {
          type: Schema.Types.ObjectId,
          ref: "SkillCategory",
          required: true,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      },
    ],

    // ─── Tool Preferences ────────────────────────────────────────────────────
    preferredTools: [
      {
        type: String,
        enum: [
          "google_meet",
          "zoom",
          "live_coding",
          "whiteboard",
          "chat_only",
        ],
      },
    ],

    // ─── Subscription & Credits ───────────────────────────────────────────────
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "pro", "enterprise"],
        default: "free",
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      isAutoRenew: { type: Boolean, default: false },
      stripeCustomerId: { type: String, default: null, select: false },
    },

    // Pre-paid credits (1 credit = 1 session)
    sessionCredits: { type: Number, default: 0, min: 0 },

    // ─── Stats ────────────────────────────────────────────────────────────────
    stats: {
      totalSessionsAttended: { type: Number, default: 0 },
      totalDoubtsFiled: { type: Number, default: 0 },
      totalDoubtsResolved: { type: Number, default: 0 },
      totalAmountSpent: { type: Number, default: 0, min: 0 },
      favouriteMentors: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
StudentProfileSchema.index({ "subscription.plan": 1, "subscription.endDate": 1 });
StudentProfileSchema.index({ "learningGoals.category": 1 });

// ─── Virtual: is subscription active? ────────────────────────────────────────
StudentProfileSchema.virtual("isSubscriptionActive").get(function () {
  if (this.subscription.plan === "free") return true;
  return this.subscription.endDate && this.subscription.endDate > new Date();
});

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);
