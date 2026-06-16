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

const BASE_URL = "http://localhost:8001/api/v1";
const MENTOR_EMAIL = "mentor_assessment_test@solve-x.com";
const PASSWORD = "AssessmentPassword@123";

async function testAssessment() {
  console.log("--------------------------------------------------");
  console.log("🧪 RUNNING MENTOR ASSESSMENT API FLOW TEST 🧪");
  console.log("--------------------------------------------------");

  // Connect to DB to set up mentor & skills
  console.log("Connecting to Database...");
  await mongoose.connect(config.MONGODB_URI);
  
  // Clean up existing test mentor
  await CommonUser.deleteMany({ email: MENTOR_EMAIL });
  await Attempt.deleteMany({});
  await Answer.deleteMany({});
  await AssessmentActivitySession.deleteMany({});

  // Ensure 'Mern Stack' skill exists
  let skill = await Skill.findOne({ name: "Mern Stack" });
  if (!skill) {
    console.log("🌱 Creating 'Mern Stack' skill...");
    const admin = await CommonUser.findOne({ role: "admin" });
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    const assessment = await AssessmentStore.create({
      createdBy: adminId,
      title: "Mern Stack Assessment",
      category: new mongoose.Types.ObjectId(),
      durationMinutes: 15,
      totalQuestions: 0,
      passingPercentage: 60,
    });

    skill = await Skill.create({
      name: "Mern Stack",
      slug: "mern-stack",
      description: "Mern stack dev skill",
      isActive: true,
      mentorCount: 0,
      source: "admin",
      assessmentId: assessment._id,
    });

    assessment.category = skill._id;
    await assessment.save();
  }

  // Create Mentor
  const mentorPasswordHash = await bcrypt.hash(PASSWORD, 10);
  const mentor = await SimpleUserAuth.create({
    name: "Assessment Mentor",
    email: MENTOR_EMAIL,
    username: "assessment_mentor",
    password: mentorPasswordHash,
    role: "mentor",
    isVerified: true,
  });

  await MentorProfile.deleteMany({ userId: mentor._id });
  await MentorProfile.create({
    userId: mentor._id,
    skillCategory: null,
    isVerifiedMentor: false,
    verificationStatus: "pending",
  });
  console.log(`Mentor user created: ${MENTOR_EMAIL}`);

  await mongoose.disconnect();
  console.log("Database seeded successfully.\n");

  // 1. LOGIN MENTOR
  console.log("🔑 Step 1: Logging in Mentor...");
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: MENTOR_EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginData.message}`);
  }
  const mentorToken = loginData.data.accessToken;
  console.log(`✅ Login successful. Access Token acquired.\n`);

  // 2. SELECT SKILL (Generates Assessment)
  console.log("🔑 Step 2: Selecting Skill 'Mern Stack'...");
  const selectSkillRes = await fetch(`${BASE_URL}/mentor/select-skill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mentorToken}`
    },
    body: JSON.stringify({ skillName: "Mern Stack" }),
  });
  const selectSkillData = await selectSkillRes.json();
  console.log("Response Status:", selectSkillRes.status);
  if (selectSkillRes.status !== 200) {
    throw new Error(`Skill selection failed: ${selectSkillData.message}`);
  }
  console.log("Response Data Preview (Questions Generated):");
  console.log(JSON.stringify(selectSkillData.data.questions, null, 2));
  console.log("\n");

  const attemptId = selectSkillData.data.attempt._id;
  const questions = selectSkillData.data.questions.questions;

  // 3. START ACTIVITY / PROCTORING SESSION
  console.log("🔑 Step 3: Starting Proctoring Activity Session...");
  const startSessionRes = await fetch(`${BASE_URL}/activity-sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      category: "Mern Stack",
      screen: { innerWidth: 1920, innerHeight: 1080, isFullscreen: true }
    }),
  });
  const startSessionData = await startSessionRes.json();
  console.log("Response Status:", startSessionRes.status);
  if (startSessionRes.status !== 200 && startSessionRes.status !== 201) {
    throw new Error(`Starting activity session failed: ${startSessionData.message}`);
  }
  console.log("Response Data:");
  console.log(JSON.stringify(startSessionData.data, null, 2));
  console.log("\n");

  const sessionId = startSessionData.data._id;

  // 4. SUBMIT ASSESSMENT (Sending All Correct Answers)
  console.log("🔑 Step 4: Submitting Assessment answers...");
  const answers = questions.map((q) => ({
    questionId: q.questionText,
    selectedAnswer: q.correctAnswer,
  }));

  const submitRes = await fetch(`${BASE_URL}/mentor/submit-assessment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      attemptId,
      sessionId,
      answers
    }),
  });
  const submitData = await submitRes.json();
  console.log("Response Status:", submitRes.status);
  if (submitRes.status !== 200) {
    throw new Error(`Assessment submission failed: ${submitData.message}`);
  }
  console.log("Response Data (Evaluation Result):");
  console.log(JSON.stringify(submitData.data, null, 2));
  console.log("\n");

  console.log("🎉 MENTOR ASSESSMENT API FLOW VERIFICATION PASSED SUCCESSFULLY! 🎉");
}

testAssessment().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
