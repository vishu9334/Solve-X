import mongoose, { Schema } from "mongoose";

const codingQuestionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    starterCode: {
      type: String,
      default: "",
    },

    expectedOutput: {
      type: String,
      required: true,
    },

    testCases: [
      {
        type: Schema.Types.ObjectId,
        ref: "TestCase",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CodingQuestion = mongoose.model(
  "CodingQuestion",
  codingQuestionSchema
);
