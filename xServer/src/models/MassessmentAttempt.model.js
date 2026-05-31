import mongoose, { Schema } from "mongoose";

const assessmentAttemptSchema = new Schema(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "MentorAssessment",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    googleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["started", "submitted", "passed", "failed"],
      default: "started",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index(
  {
    assessmentId: 1,
    userId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

assessmentAttemptSchema.index(
  {
    assessmentId: 1,
    googleId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

export const AssessmentAttempt = mongoose.model(
  "AssessmentAttempt",
  assessmentAttemptSchema
);
