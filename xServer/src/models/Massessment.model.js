import mongoose, { Schema } from "mongoose";
import { skillCategories } from "./AskillsCategory.model.js";

const mentorAssessmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    googleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    skill: {
      type: String,
      enum: skillCategories,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["MCQ", "CODING", "MIXED"],
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    passingScore: {
      type: Number,
      required: true,
      min: 0,
    },

    mcqQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "McqQuestion",
      },
    ],

    codingQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "CodingQuestion",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MentorAssessment = mongoose.model(
  "MentorAssessment",
  mentorAssessmentSchema
);
