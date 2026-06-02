import mongoose, { Schema } from "mongoose";

const attemptSchema = new Schema(
  {
    
    attempts: [{
        type: Schema.Types.ObjectId,
        ref: "AssessmentActivitySession",
    }],

    userId: {
        type:Schema.Types.ObjectId,
        ref:"CommonUser"
    }
  },
  { timestamps: true }
);

export const Attempt = mongoose.model("Attempt", attemptSchema);