/**
 * End-to-End Pass Test
 * - Seeds DB fresh
 * - Updates mentor email to real email
 * - Logs in
 * - Selects skill
 * - Starts clean activity session (no violations)
 * - Submits ALL correct answers → PASS
 * - Email goes to real email
 */
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

const REAL_EMAIL = "vishalkumarptn32@gmail.com";
const BASE_URL = "http://localhost:8000/api/v1";

function toTitleCase(str) {
  if (!str) return str;
  return str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

async function run() {
  // ─── Step 1: Seed DB ───────────────────────────────────
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.MONGODB_URI);
  console.log("Connected.\n");

  console.log("🧹 Clearing collections...");
  await CommonUser.deleteMany({});
  await MentorProfile.deleteMany({});
  await Skill.deleteMany({});
  await AssessmentStore.deleteMany({});
  await Attempt.deleteMany({});
  await Answer.deleteMany({});
  await AssessmentActivitySession.deleteMany({});

  // Create admin
  const adminHash = await bcrypt.hash("AdminPassword@123", 10);
  const admin = await SimpleUserAuth.create({
    name: "Admin User", email: "admin@solve-x.com", username: "admin",
    password: adminHash, role: "admin", isVerified: true,
  });

  // Create mentor WITH REAL EMAIL
  const mentorHash = await bcrypt.hash("MentorPassword@123", 10);
  const mentor = await SimpleUserAuth.create({
    name: "Vishal Kumar", email: REAL_EMAIL, username: "vishalkumarptn32",
    password: mentorHash, role: "mentor", isVerified: true,
  });
  await MentorProfile.create({ userId: mentor._id });

  // Create Mern Stack skill
  const assessment = await AssessmentStore.create({
    createdBy: admin._id, title: "Mern Stack Assessment",
    category: new mongoose.Types.ObjectId(),
    durationMinutes: 15, totalQuestions: 0, passingPercentage: 60,
  });
  const name = toTitleCase("Mern Stack");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const result = await Skill.collection.insertOne({
    name, slug, description: "MERN full stack", isActive: true,
    mentorCount: 0, source: "admin", createdBy: admin._id,
    assessmentId: assessment._id, createdAt: new Date(), updatedAt: new Date(),
  });
  assessment.category = result.insertedId;
  await assessment.save();

  console.log(`Seeded mentor: ${REAL_EMAIL}`);
  console.log(`Seeded skill: Mern Stack\n`);
  await mongoose.disconnect();

  // ─── Step 2: Login ─────────────────────────────────────
  console.log("Logging in...");
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: REAL_EMAIL, password: "MentorPassword@123" }),
  });
  const loginData = await loginRes.json();
  if (loginData.statusCode !== 200) {
    console.error("Login failed:", loginData.message);
    return;
  }
  const token = loginData.data.accessToken;
  console.log(`Logged in as ${loginData.data.userObj.name}\n`);

  // ─── Step 3: Select Skill ──────────────────────────────
  console.log("Selecting Mern Stack skill...");
  const skillRes = await fetch(`${BASE_URL}/mentor/select-skill`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ skillName: "Mern Stack" }),
  });
  const skillData = await skillRes.json();
  if (skillData.statusCode !== 200) {
    console.error("Skill select failed:", skillData.message);
    return;
  }
  const attemptId = skillData.data.attempt._id;
  const questions = skillData.data.questions.questions;
  console.log(`Skill selected. ${questions.length} questions generated.`);
  console.log(`   AttemptId: ${attemptId}\n`);

  // ─── Step 4: Start CLEAN Activity Session ──────────────
  console.log("Starting clean activity session (no violations)...");
  const sessionRes = await fetch(`${BASE_URL}/activity-sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      category: "Mern Stack",
      screen: { innerWidth: 1920, innerHeight: 1080, isFullscreen: true },
    }),
  });
  const sessionData = await sessionRes.json();
  const sessionId = sessionData.data._id;
  console.log(`Session started. SessionId: ${sessionId}`);
  console.log(`   Activity decision: ${sessionData.data.activityDecision} (clean!)\n`);

  // ─── Step 5: Submit ALL Correct Answers ────────────────
  console.log("Submitting all correct answers...");
  const answers = questions.map((q) => ({
    questionId: q.questionText,
    selectedAnswer: q.correctAnswer,
  }));

  const submitRes = await fetch(`${BASE_URL}/mentor/submit-assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ attemptId, sessionId, answers }),
  });
  const submitData = await submitRes.json();

  console.log("\n" + "=".repeat(50));
  console.log("ASSESSMENT RESULT:");
  console.log("=".repeat(50));
  console.log(`   Status:     ${submitData.data.attemptStatus}`);
  console.log(`   Score:      ${submitData.data.evaluation.score}%`);
  console.log(`   Passed:     ${submitData.data.evaluation.isPassed ? "YES" : "NO"}`);
  console.log(`   Proctoring: ${submitData.data.evaluation.activityDecision}`);
  console.log(`   Clean:      ${submitData.data.evaluation.isClean ? "YES" : "NO"}`);
  console.log("=".repeat(50));

  if (submitData.data.evaluation.isPassed) {
    console.log(`\nPASSED! Congratulations email sent to: ${REAL_EMAIL}`);
    console.log("Check your Gmail inbox (+ spam folder)!");
  } else {
    console.log(`\nFail email sent to: ${REAL_EMAIL}`);
  }
}

run().catch(console.error);
