import mongoose, { Schema } from "mongoose";

const assessmentSubmissionSchema = new Schema(
  {
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

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    googleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    questionType: {
      type: String,
      enum: ["MCQ", "CODING"],
      required: true,
    },

    mcqQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "McqQuestion",
    },

    codingQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "CodingQuestion",
    },

    answer: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      trim: true,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    marksObtained: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSubmissionSchema.index(
  {
    attemptId: 1,
    mcqQuestionId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

assessmentSubmissionSchema.index(
  {
    attemptId: 1,
    codingQuestionId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

export const AssessmentSubmission = mongoose.model(
  "AssessmentSubmission",
  assessmentSubmissionSchema
);
