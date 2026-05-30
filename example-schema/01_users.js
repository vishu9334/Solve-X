const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * USERS — Base model shared by Student, Mentor, Admin
 *
 * Design decisions:
 * - Single collection for all roles (discriminator pattern)
 * - Soft-delete (isDeleted) to preserve audit history
 * - refreshTokens array supports multi-device login
 * - loginAttempts + lockUntil handle brute-force protection
 * - OTP is stored and managed via Redis (removed from Mongo)
 */

const UserSchema = new Schema(
  {
    // ─── Identity ───────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
    },

    phone: {
      countryCode: {
        type: String,
        default: "+91",
        match: [/^\+\d{1,4}$/, "Invalid country code"],
      },
      number: {
        type: String,
        trim: true,
        match: [/^\d{7,15}$/, "Invalid phone number"],
      },
      isVerified: { type: Boolean, default: false },
    },

    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Never returned in queries by default
    },

    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }, // Cloudinary / S3 key
    },

    // ─── Role & Access ───────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["student", "mentor", "admin", "superadmin"],
        message: "Role must be student, mentor, admin, or superadmin",
      },
      required: true,
      default: "student",
      index: true,
    },

    // ─── Auth Tokens ─────────────────────────────────────────────────────────
    refreshTokens: [
      {
        token: { type: String, select: false },
        deviceInfo: { type: String },  // e.g. "Chrome/Mac"
        ip: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],

    // ─── OTP / Email Verification ────────────────────────────────────────────
    // OTP is managed using Redis; email verification status is stored here
    isEmailVerified: { type: Boolean, default: false },

    // ─── Account Security ────────────────────────────────────────────────────
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null }, // Account locked until this time

    // ─── OAuth / Social Login ────────────────────────────────────────────────
    oauthProviders: [
      {
        provider: {
          type: String,
          enum: ["google"], // Only Google authentication supported
        },
        providerId: { type: String },
        accessToken: { type: String, select: false },
      },
    ],

    // ─── Password Reset ──────────────────────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // ─── Account Status ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "suspended", "pending_verification", "deactivated"],
      default: "pending_verification",
      index: true,
    },

    // ─── Soft Delete ─────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // ─── Last Activity ───────────────────────────────────────────────────────
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ "phone.number": 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────
UserSchema.pre("find", function () {
  this.where({ isDeleted: false }); // Auto-exclude soft-deleted docs
});

UserSchema.pre("findOne", function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("User", UserSchema);
