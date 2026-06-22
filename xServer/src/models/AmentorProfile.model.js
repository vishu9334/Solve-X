import mongoose, { Schema } from 'mongoose';
import {socialMediaLinkSchema} from './socialMediaBase.model.js'
const mentorProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "CommonUser",
        required: true,
        unique: true,
    },

    skillCategory: {
        type: Schema.Types.ObjectId,
        ref: "Skill",
        default: null,
    },

    isVerifiedMentor: {
        type: Boolean,
        default: false,
    },

    verificationStatus: {
        type: String,
        enum: ["pending", "rejected", "approved"],
        default: "pending",
    },

    lastAssessmentAttemptId: {
        type: Schema.Types.ObjectId,
        ref: "Attempt",
        default: null,
    },
      socialLinks: {
          type: [socialMediaLinkSchema],
          default: [],
        },
    jobTitle: {
        type: String,
        default: "",
    },
    company: {
        type: String,
        default: "",
    },
    experienceYears: {
        type: Number,
        default: 0,
    },
    education: {
        type: String,
        default: "",
    },
    certifications: {
        type: [String],
        default: [],
    },
    rating: {
        type: Number,
        default: 5.0,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    timezone: {
        type: String,
        default: "",
    },
    preferredLanguage: {
        type: String,
        default: "",
    },
    payoutDetails: {
        upiId: { type: String, default: "" },
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifscCode: { type: String, default: "" },
    },
    verifiedAt: {
        type: Date,
        default: null,
    },

    rejectedAt: {
        type: Date,
        default: null,
    },

    rejectionReason: {
        type: String,
        trim: true,
        default: null,
    },
}, { timestamps: true });

export const MentorProfile = mongoose.model("MentorProfile", mentorProfileSchema);