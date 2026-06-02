// models/assessmentActivitySession.model.js

import mongoose, { Schema } from "mongoose";

const screenSnapshotSchema = new Schema(
  {
    innerWidth: {
      type: Number,
      default: null,
    },

    innerHeight: {
      type: Number,
      default: null,
    },

    outerWidth: {
      type: Number,
      default: null,
    },

    outerHeight: {
      type: Number,
      default: null,
    },

    screenWidth: {
      type: Number,
      default: null,
    },

    screenHeight: {
      type: Number,
      default: null,
    },

    availWidth: {
      type: Number,
      default: null,
    },

    availHeight: {
      type: Number,
      default: null,
    },

    isFullscreen: {
      type: Boolean,
      default: false,
    },

    isTabHidden: {
      type: Boolean,
      default: false,
    },

    hasFocus: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const activityEventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "FULLSCREEN_PROMPT_SHOWN",
        "FULLSCREEN_ENTERED",
        "FULLSCREEN_EXITED",

        "TAB_SWITCHED",
        "TAB_RETURNED",

        "WINDOW_BLUR",
        "WINDOW_FOCUS",

        "SCREEN_RESIZED",

        "PAGE_REFRESH",
        "PAGE_CLOSE",

        "TEST_STARTED",
        "TEST_SUBMITTED",
        "TIME_EXPIRED",
      ],
    },

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },

    message: {
      type: String,
      trim: true,
    },

    screen: {
      type: screenSnapshotSchema,
      default: {},
    },

    metadata: {
      type: Object,
      default: {},
    },

    occurredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const assessmentActivitySessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref:"CommonUser"
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    totalEvents: {
      type: Number,
      default: 0,
    },

    warningCount: {
      type: Number,
      default: 0,
    },

    criticalCount: {
      type: Number,
      default: 0,
    },

    hasTabSwitch: {
      type: Boolean,
      default: false,
    },

    hasFullscreenExit: {
      type: Boolean,
      default: false,
    },

    hasScreenResize: {
      type: Boolean,
      default: false,
    },

    hasPageClose: {
      type: Boolean,
      default: false,
    },

    activityDecision: {
      type: String,
      enum: ["clean", "suspicious", "rejected"],
      default: "clean",
    },

    activityRejectReason: {
      type: String,
      default: null,
    },

    events: {
      type: [activityEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

assessmentActivitySessionSchema.index({
  userId: 1,
  category: 1,
  createdAt: -1,
});

export const AssessmentActivitySession = mongoose.model(
  "AssessmentActivitySession",
  assessmentActivitySessionSchema
);