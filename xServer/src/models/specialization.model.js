import mongoose, { Schema } from "mongoose";
import { toTitleCase } from "../utils/toTitleCase.util.js";

const specializationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // Unique enforced via case-insensitive collation index below
      // DSA, MERN, System Design — always Title Case
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      // auto-generated from name: "React Native" → "react-native"
    },

    description: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: false,
    },

    mentorCount: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
      enum: ["admin", "mentor"],
      default: "mentor",
     
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "CommonUser",
      default: null,
    },

    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "AssessmentStore",
      default: null, // is specialization ka assessment kaun sa hai
    },
  },
  { timestamps: true }
);

// Auto Title Case name + generate slug before save
specializationSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.name = toTitleCase(this.name);
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
});

// Case-insensitive collation index on name for duplicate checks
specializationSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export const Specialization = mongoose.model("Specialization", specializationSchema);