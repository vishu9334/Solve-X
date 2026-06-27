import mongoose, { Schema } from 'mongoose'
import {socialMediaLinkSchema} from './socialMediaBase.model.js'
const studentProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    unique: true,
    ref: "CommonUser"
  },
  bio: String,
  socialLinks: {
    type: [socialMediaLinkSchema],
    default: [],
  },
  skills: {
    type: [String],
    default: [],
  },
  education: {
    type: String,
    default: "",
  },
  preferredLanguage: {
    type: String,
    default: "",
  },
  timezone: {
    type: String,
    default: "",
  },
  subscriptionStatus: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);


// express-slow-down