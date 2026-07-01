import mongoose, { Schema } from "mongoose";

const mentorOfferSchema = new Schema({
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: "CommonUser",
        required: true,
    },
    mentorName: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    availableTime: {
        type: String,
        trim: true,
    },
    sessionType: {
        type: String,
        enum: ["instant", "scheduled"],
        default: "instant",
    },
    scheduledTime: {
        type: Date,
        default: null,
    },
    offeredAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const chatMessageSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "CommonUser",
        required: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const doubtSessionSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: "CommonUser",
        required: true,
        index: true,
    },

    specializedId: {
        type: Schema.Types.ObjectId,
        ref: "Specialization",
        required: true,
    },

    question: {
        type: String,
        required: true,
        trim: true,
    },

    sessionDuration: {
        type: Number,
        required: true, // in minutes
    },

    status: {
        type: String,
        enum: ["open", "mentor_selected", "in_session", "completed", "expired", "scheduled"],
        default: "open",
        index: true,
    },

    sessionType: {
        type: String,
        enum: ["instant", "scheduled"],
        default: "instant",
    },

    scheduledTime: {
        type: Date,
        default: null,
    },

    rescheduleRequest: {
        proposedBy: {
            type: Schema.Types.ObjectId,
            ref: "CommonUser",
            default: null,
        },
        newScheduledTime: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: null,
        },
    },

    mentorOffers: {
        type: [mentorOfferSchema],
        default: [],
    },

    selectedMentorId: {
        type: Schema.Types.ObjectId,
        ref: "CommonUser",
        default: null,
    },

    chatRoomId: {
        type: String,
        default: null,
    },

    videoRoomUrl: {
        type: String,
        default: null,
    },

    videoRoomName: {
        type: String,
        default: null,
    },

    cancellationReason: {
        type: String,
        default: null,
    },

    chatMessages: {
        type: [chatMessageSchema],
        default: [],
    },

    sessionStartedAt: {
        type: Date,
        default: null,
    },

    sessionEndedAt: {
        type: Date,
        default: null,
    },

    // TTL index — auto-delete 4 hours after session ends
    expiresAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// TTL index: MongoDB automatically deletes documents when expiresAt passes
doubtSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index: fast lookup for active sessions per student
doubtSessionSchema.index({ studentId: 1, status: 1 });

export const DoubtSession = mongoose.model("DoubtSession", doubtSessionSchema);
