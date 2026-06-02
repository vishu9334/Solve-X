// models/assessment.model.js
import mongoose, { Schema } from "mongoose";

const assessmentStoreSchema = new Schema(
  {

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "CommonUser",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
                // Ik assessment form hoga MCQ
    category: {
      type: String,
      required: true,
      enum: [
        "DSA",
        "MERN",
        "System Design",
        "AI",
        "Programming",
        "DevOps",
        "Other",
      ],
      index: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    passingPercentage: {
      type: Number,
      required: true,
    },

    maxWarningsAllowed: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const AssessmentStore = mongoose.model("AssessmentStore", assessmentStoreSchema);