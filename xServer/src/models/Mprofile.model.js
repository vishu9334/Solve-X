import mongoose, { Schema } from "mongoose";
import { skillCategories } from "./AskillsCategory.model.js";

const mentorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    googleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    expertiseCategories: {
      type: [String],
      enum: skillCategories,
      default: [],
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },

    sessionsCompleted: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "reject", "active"],
      default: "pending",
    },

    verifiedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
      lowercase: true,
    },

    totalVerificationAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const MentorProfile = mongoose.model("MentorProfile", mentorProfileSchema);
