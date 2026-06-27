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
      default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    role: {
      type: String,
      enum: ["admin", "mentor", "student"],
      default: "student",
    }
  },
  {
    discriminatorKey: "authType",  // ← sirf field ka NAAM, value nahi
    timestamps: true,              // ← sirf ek jagah
  }
);
  
export const CommonUser = mongoose.model("CommonUser", baseUserSchema);