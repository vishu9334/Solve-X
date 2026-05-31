import mongoose, { Schema } from "mongoose";

export const skillCategories = [
  "DSA",
  "MERN",
  "System Design",
  "AI",
  "Programming",
  "DevOps",
  "Other",
];
// This section access mentor for create experties skill category and select category not student.

const skillsCategorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    googleId:{
      type:Schema.Types.ObjectId,
      ref:"GoogleAuth",
    },
    role:{
        type:Schema.Types.ObjectId,
        ref:"Role"
    },
    category: {
      type: String,
      enum: skillCategories,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SkillsCategory = mongoose.model(
  "SkillsCategory",
  skillsCategorySchema
);
