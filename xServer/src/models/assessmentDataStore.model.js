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

    category: {
      type: Schema.Types.ObjectId,
      ref: "Specialization",
      required: true,
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
      min: 0,
      max: 100,
    },

    maxWarningsAllowed: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

export const AssessmentStore = mongoose.model("AssessmentStore", assessmentStoreSchema);