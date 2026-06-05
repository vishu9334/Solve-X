import mongoose, { Schema } from "mongoose";

const attemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "CommonUser",
      required: true,
      index: true,
    },

    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },

    attempts: [{
        type: Schema.Types.ObjectId,
        ref: "AssessmentActivitySession",
    }],
  },
  { timestamps: true }
);

export const Attempt = mongoose.model("Attempt", attemptSchema);
