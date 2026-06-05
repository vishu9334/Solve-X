import mongoose, { Schema } from 'mongoose';

const mentorProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "CommonUser",
  },
  skillCategory: {
    type: String,
    enum: [
      "DSA",
      "MERN",
      "System Design",
      "AI",
      "DevOps",
    ],
  },
  isVerifiedMentor: { type: Boolean, default: false }, // here we invoke middleware to flag true. after assessment clear then true. this key word to authorization route handle 
  verificationStatus: {
    type: String,
    enum: ["pending", "reject", "approved"], // typo fix: "pendding" → "pending"
    default: "pending",
  },
  lastAssessmentAttemptId: {
    type: Schema.Types.ObjectId,
    ref: "Attempt",
  },
  verifiedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, trim: true, lowercase: true },
}, { timestamps: true });

export const MentorProfile = mongoose.model("MentorProfile", mentorProfileSchema);
