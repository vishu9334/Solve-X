import mongoose, { Schema } from "mongoose";
import { socialMediaLinkSchema } from "./socialMediaBase.model.js";

const adminProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "CommonUser",
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    socialLinks: {
      type: [socialMediaLinkSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);