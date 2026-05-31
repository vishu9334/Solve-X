import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    userGoogleId: {
      type: Schema.Types.ObjectId,
      ref: "GoogleAuth",
    },

    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Role = mongoose.model("Role", roleSchema);
