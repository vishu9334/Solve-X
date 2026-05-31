import mongoose, { Schema } from "mongoose";

const testCaseSchema = new Schema(
  {
    input: {
      type: String,
      default: "",
    },

    expectedOutput: {
      type: String,
      required: true,
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

export const TestCase = mongoose.model("TestCase", testCaseSchema);
