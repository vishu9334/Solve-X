import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { CommonUser } from "./src/models/AbaseUser.model.js";
import { SimpleUserAuth } from "./src/models/AuserAuth.model.js";
import { MentorProfile } from "./src/models/AmentorProfile.model.js";
import { Skill } from "./src/models/skill.model.js";
import { AssessmentStore } from "./src/models/assessmentDataStore.model.js";
import { Attempt } from "./src/models/assessmentAttempt.model.js";
import { Answer } from "./src/models/Answer.model.js";
import { AssessmentActivitySession } from "./src/models/assessmentActivityDataStore.model.js";
import config from "./src/configs/config.js";

dotenv.config();

const MONGODB_URI = config.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables.");
  process.exit(1);
}

// Simple Title Case helper for seeding
function toTitleCase(str) {
  if (!str) return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function seed() {
  try {
    console.log(`🔌 Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    // 1. Clear database collections to start fresh
    console.log("🧹 Clearing existing collections...");
    await CommonUser.deleteMany({});
    await MentorProfile.deleteMany({});
    await Skill.deleteMany({});
    await AssessmentStore.deleteMany({});
    await Attempt.deleteMany({});
    await Answer.deleteMany({});
    await AssessmentActivitySession.deleteMany({});
    console.log("✅ Collections cleared.");

    // 2. Create Admin User
    const adminPasswordHash = await bcrypt.hash("AdminPassword@123", 10);
    const adminUser = await SimpleUserAuth.create({
      name: "Admin User",
      email: "connect.solvex99@gmail.com",
      username: "admin",
      password: adminPasswordHash,
      role: "admin",
      isVerified: true,
    });
    console.log(`👤 Seeded Admin: connect.solvex99@gmail.com (Password: AdminPassword@123)`);

    // 3. Create Mentor User & Profile
    const mentorPasswordHash = await bcrypt.hash("MentorPassword@123", 10);
    const mentorUser = await SimpleUserAuth.create({
      name: "Test Mentor",
      email: "mentor@solve-x.com",
      username: "mentor",
      password: mentorPasswordHash,
      role: "mentor",
      isVerified: true,
    });

    await MentorProfile.create({
      userId: mentorUser._id,
      skillCategory: null,
      isVerifiedMentor: false,
      verificationStatus: "pending",
    });
    console.log(`👤 Seeded Mentor: mentor@solve-x.com (Password: MentorPassword@123)`);

    // 4. Seed default Admin Skills
    const defaultSkills = [
      { name: "Data Structures & Algorithms", description: "Core algorithms and data structures assessment." },
      { name: "Mern Stack", description: "MongoDB, Express, React, Node.js full stack development." },
      { name: "System Design", description: "High-level architecture and system scaling concepts." },
    ];

    console.log("🌱 Seeding Admin Skills and Assessment Stores...");
    for (const skillData of defaultSkills) {
      // Create AssessmentStore first
      const assessment = await AssessmentStore.create({
        createdBy: adminUser._id,
        title: `${skillData.name} Assessment`,
        category: new mongoose.Types.ObjectId(), // temporary placeholder
        durationMinutes: 15,
        totalQuestions: 0,
        passingPercentage: 60,
        maxWarningsAllowed: 3,
      });

      // Format name and generate slug manually
      const formattedName = toTitleCase(skillData.name);
      const slug = formattedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // Insert Skill directly into the MongoDB collection to bypass Mongoose pre-save hook
      const skillDoc = {
        name: formattedName,
        slug: slug,
        description: skillData.description,
        isActive: true,
        mentorCount: 0,
        source: "admin",
        createdBy: adminUser._id,
        assessmentId: assessment._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await Skill.collection.insertOne(skillDoc);
      const skillId = result.insertedId;

      // Link AssessmentStore back to the created Skill
      assessment.category = skillId;
      await assessment.save();

      console.log(`✅ Seeded Skill: "${formattedName}" (Slug: "${slug}") with linked Assessment.`);
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

seed();
