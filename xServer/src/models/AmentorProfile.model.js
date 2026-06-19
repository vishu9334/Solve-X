import mongoose, { Schema } from 'mongoose';

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