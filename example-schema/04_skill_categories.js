const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * SKILL CATEGORIES — Taxonomy of doubt/skill categories
 *
 * Design decisions:
 * - Self-referencing parent for hierarchical categories (DSA > Arrays > Sliding Window)
 * - slug for URL-friendly category navigation
 * - icon/color for UI rendering
 * - isActive flag for soft-disabling categories without deletion
 */

const SkillCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [80, "Name too long"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug must be URL-safe"],
      index: true,
    },

    description: {
      type: String,
      maxlength: [500, "Description too long"],
      default: "",
    },

    // Self-reference for hierarchy (e.g. "Arrays" is a child of "DSA")
    parent: {
      type: Schema.Types.ObjectId,
      ref: "SkillCategory",
      default: null,
      index: true,
    },

    // Breadcrumb path stored for fast queries (e.g. ["dsa", "arrays"])
    ancestorSlugs: [{ type: String }],

    icon: { type: String, default: null }, // Emoji or icon class
    color: {
      type: String,
      default: "#6366f1",
      match: [/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"],
    },

    // How many verified mentors cover this category — denormalized for speed
    mentorCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true },

    sortOrder: { type: Number, default: 0 }, // For manual ordering in UI
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
SkillCategorySchema.index({ parent: 1, isActive: 1 });
SkillCategorySchema.index({ slug: 1, isActive: 1 });

module.exports = mongoose.model("SkillCategory", SkillCategorySchema);
