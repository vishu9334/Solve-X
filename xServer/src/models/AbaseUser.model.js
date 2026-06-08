import mongoose, { Schema } from "mongoose";

const baseUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "mentor", "student"],
      default: "student",
    },
  },
  {
    discriminatorKey: "authType",  // ← sirf field ka NAAM, value nahi
    timestamps: true,              // ← sirf ek jagah
  }
);
  
export const CommonUser = mongoose.model("CommonUser", baseUserSchema);