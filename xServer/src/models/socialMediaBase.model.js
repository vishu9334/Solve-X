import { Schema } from "mongoose";

export const socialMediaLinkSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["linkedin", "github", "twitter", "instagram", "youtube", "portfolio", "other"],
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);