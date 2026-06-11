import mongoose, { Schema } from "mongoose";

const answerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "CommonUser",
      required: true,
      index: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      required: true,
    },
    selectedAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique answer per question per attempt
answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const Answer = mongoose.model("Answer", answerSchema);
