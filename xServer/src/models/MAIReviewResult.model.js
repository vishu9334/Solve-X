import mongoose, { Schema } from "mongoose";

const videoAnalysisSchema = new Schema(
  {
    faceVisible: {
      type: Boolean,
      default: false,
    },

    multipleFacesDetected: {
      type: Boolean,
      default: false,
    },

    identityConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    suspiciousMovement: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const screenAnalysisSchema = new Schema(
  {
    screenShared: {
      type: Boolean,
      default: false,
    },

    tabSwitchDetected: {
      type: Boolean,
      default: false,
    },

    externalHelpDetected: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const audioAnalysisSchema = new Schema(
  {
    voiceDetected: {
      type: Boolean,
      default: false,
    },

    otherVoiceDetected: {
      type: Boolean,
      default: false,
    },

    noiseLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
  },
  {
    _id: false,
  }
);

const aiReviewResultSchema = new Schema(
  {
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: "MentorRecording",
      required: true,
    },

    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
    },

    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "MentorAssessment",
      required: true,
    },

    mentorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    mentorGoogleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    aiProvider: {
      type: String,
      trim: true,
    },

    aiModel: {
      type: String,
      trim: true,
    },

    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    decision: {
      type: String,
      enum: ["approved", "rejected", "needs_review"],
      required: true,
    },

    videoAnalysis: {
      type: videoAnalysisSchema,
      default: {},
    },

    screenAnalysis: {
      type: screenAnalysisSchema,
      default: {},
    },

    audioAnalysis: {
      type: audioAnalysisSchema,
      default: {},
    },

    flags: {
      type: [String],
      default: [],
    },

    feedback: {
      type: String,
      trim: true,
    },

    rawResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },

    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiReviewResultSchema.index(
  {
    recordingId: 1,
  },
  {
    unique: true,
  }
);

export const AIReviewResult = mongoose.model(
  "AIReviewResult",
  aiReviewResultSchema
);
