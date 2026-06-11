import mongoose, { Schema } from "mongoose";

const attemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "CommonUser",
      required: true,
      index: true,
    },

    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentStore",
      required: true,
      index: true,
    },

    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },

    // status track karo
    status: {
      type: String,
      enum: ["pending", "in_progress", "passed", "failed"],
      default: "pending",
    },

    // score + result track karo
    attempts: [{
      sessionId: { type: Schema.Types.ObjectId, ref: "AssessmentActivitySession" },
      score: { type: Number, default: 0 },
      isPassed: { type: Boolean, default: false },
      attemptedAt: { type: Date, default: Date.now },
  }],
  },
{ timestamps: true }
);

// ek user ka ek hi tracker per assessment
attemptSchema.index({ userId: 1, assessmentId: 1 }, { unique: true });

export const Attempt = mongoose.model("Attempt", attemptSchema);