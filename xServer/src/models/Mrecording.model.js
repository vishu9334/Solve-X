import mongoose, { Schema } from "mongoose";

const mentorRecordingSchema = new Schema(
  {
    mentorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    mentorGoogleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "MentorAssessment",
      required: true,
    },

    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
    },

    videoUrl: {
      type: String,
      trim: true,
    },

    screenRecordingUrl: {
      type: String,
      trim: true,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    recordingStatus: {
      type: String,
      enum: ["recording", "uploaded", "processing", "ready", "failed"],
      default: "recording",
    },

    reviewStatus: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected", "failed"],
      default: "pending",
    },

    aiProvider: {
      type: String,
      trim: true,
    },

    aiModel: {
      type: String,
      trim: true,
    },

    aiReviewScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    aiReviewFeedback: {
      type: String,
      trim: true,
    },

    aiReviewResult: {
      type: Schema.Types.Mixed,
      default: {},
    },

    reviewedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

mentorRecordingSchema.index(
  {
    attemptId: 1,
  },
  {
    unique: true,
  }
);

export const MentorRecording = mongoose.model(
  "MentorRecording",
  mentorRecordingSchema
);
