import mongoose, { Schema } from "mongoose";

const mcqQuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    marks: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const McqQuestion = mongoose.model("McqQuestion", mcqQuestionSchema);
