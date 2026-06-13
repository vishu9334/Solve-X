import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { CommonUser } from "./src/models/AbaseUser.model.js";
import { SimpleUserAuth } from "./src/models/AuserAuth.model.js";
import { MentorProfile } from "./src/models/AmentorProfile.model.js";
import { Skill } from "./src/models/skill.model.js";
import { DoubtSession } from "./src/models/doubtSession.model.js";
import config from "./src/configs/config.js";

dotenv.config();

const BASE_URL = "http://localhost:8000/api/v1";

const STUDENT_EMAIL = "student_test@solve-x.com";
const MENTOR_EMAIL = "mentor_test@solve-x.com";
const PASSWORD = "TestPassword@123";

async function run() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(config.MONGODB_URI);
  console.log("✅ Connected.\n");

  // 1. Seed Student, Mentor, Skill & MentorProfile
  console.log("🧹 Cleaning up old test users...");
  await CommonUser.deleteMany({ email: { $in: [STUDENT_EMAIL, MENTOR_EMAIL] } });
  
  // Find or create Mern Stack skill
  let skill = await Skill.findOne({ name: "Mern Stack" });
  if (!skill) {
    console.log("🌱 Skill 'Mern Stack' not found. Creating one...");
    skill = await Skill.create({
      name: "Mern Stack",
      slug: "mern-stack",
      description: "MERN Stack Doubt Category",
      isActive: true,
      mentorCount: 0,
      source: "admin",
    });
  }
  console.log(`🎯 Skill: Mern Stack (ID: ${skill._id})`);

  // Create Student
  console.log("🌱 Creating student...");
  const studentPasswordHash = await bcrypt.hash(PASSWORD, 10);
  const student = await SimpleUserAuth.create({
    name: "Test Student",
    email: STUDENT_EMAIL,
    username: "student_test",
    password: studentPasswordHash,
    role: "student",
    isVerified: true,
  });
  console.log(`👤 Student created: ${STUDENT_EMAIL}`);

  // Create Mentor
  console.log("🌱 Creating mentor...");
  const mentorPasswordHash = await bcrypt.hash(PASSWORD, 10);
  const mentor = await SimpleUserAuth.create({
    name: "Test Mentor",
    email: MENTOR_EMAIL,
    username: "mentor_test",
    password: mentorPasswordHash,
    role: "mentor",
    isVerified: true,
  });

  // Create Verified Mentor Profile linked to Mern Stack
  await MentorProfile.deleteMany({ userId: mentor._id });
  const mentorProfile = await MentorProfile.create({
    userId: mentor._id,
    skillCategory: skill._id,
    isVerifiedMentor: true,
    verificationStatus: "approved",
  });
  console.log(`👤 Mentor created: ${MENTOR_EMAIL} with verified profile.`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from DB for API testing.\n");

  // 2. Login Student & Mentor to get Access Tokens
  console.log("🔑 Logging in student...");
  const studentLoginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: PASSWORD }),
  });
  const studentLoginData = await studentLoginRes.json();
  if (studentLoginData.statusCode !== 200) {
    throw new Error(`Student login failed: ${studentLoginData.message}`);
  }
  const studentToken = studentLoginData.data.accessToken;
  const studentId = studentLoginData.data.userObj._id;
  console.log(`✅ Logged in Student. ID: ${studentId}\n`);

  console.log("🔑 Logging in mentor...");
  const mentorLoginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: MENTOR_EMAIL, password: PASSWORD }),
  });
  const mentorLoginData = await mentorLoginRes.json();
  if (mentorLoginData.statusCode !== 200) {
    throw new Error(`Mentor login failed: ${mentorLoginData.message}`);
  }
  const mentorToken = mentorLoginData.data.accessToken;
  const mentorId = mentorLoginData.data.userObj._id;
  console.log(`✅ Logged in Mentor. ID: ${mentorId}\n`);

  // 3. Student posts a doubt question
  console.log("❓ Student raising a doubt...");
  const askDoubtUrl = `${BASE_URL}/student/ask-doubt/${studentId}?skillIdentifier=${skill._id}&selectSessionTime=15`;
  const askDoubtRes = await fetch(askDoubtUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ typeWriteQuestion: "How do we implement real-time chat with Socket.io?" }),
  });
  const askDoubtData = await askDoubtRes.json();
  if (askDoubtData.statusCode !== 200) {
    throw new Error(`Ask doubt failed: ${askDoubtData.message}`);
  }
  const doubtSessionId = askDoubtData.data.doubtSessionId;
  console.log(`✅ Doubt posted successfully. Doubt Session ID: ${doubtSessionId}\n`);

  // Verify state in DB
  await mongoose.connect(config.MONGODB_URI);
  let session = await DoubtSession.findById(doubtSessionId);
  console.log(`🔍 Verified Session in DB: status = "${session.status}", questions = "${session.question}"`);
  if (session.status !== "open") {
    throw new Error(`Expected session status to be 'open', got '${session.status}'`);
  }
  await mongoose.disconnect();

  // 4. Mentor replies to doubt with offer
  console.log("💸 Mentor replying to doubt with offer...");
  const replyRes = await fetch(`${BASE_URL}/mentor/reply-doubt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      doubtSessionId,
      price: 250,
      availableTime: "Immediate"
    }),
  });
  const replyData = await replyRes.json();
  if (replyData.statusCode !== 200) {
    throw new Error(`Reply to doubt failed: ${replyData.message}`);
  }
  console.log("✅ Mentor offer submitted successfully.\n");

  // Verify offer in DB
  await mongoose.connect(config.MONGODB_URI);
  session = await DoubtSession.findById(doubtSessionId);
  console.log(`🔍 Verified offers list in DB: length = ${session.mentorOffers.length}`);
  if (session.mentorOffers.length !== 1) {
    throw new Error(`Expected 1 offer, got ${session.mentorOffers.length}`);
  }
  console.log(`   Offer details: Mentor: ${session.mentorOffers[0].mentorName}, Price: ${session.mentorOffers[0].price}, Time: ${session.mentorOffers[0].availableTime}`);
  await mongoose.disconnect();

  // 5. Student selects the mentor
  console.log("👉 Student selecting mentor...");
  const selectRes = await fetch(`${BASE_URL}/student/select-mentor/${doubtSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ selectedMentorId: mentorId }),
  });
  const selectData = await selectRes.json();
  if (selectData.statusCode !== 200) {
    throw new Error(`Select mentor failed: ${selectData.message}`);
  }
  console.log(`✅ Mentor selected successfully. Chat Room ID: ${selectData.data.chatRoomId}\n`);

  // Verify status is now 'in_session' (or 'mentor_selected' updated by Socket room creation)
  await mongoose.connect(config.MONGODB_URI);
  session = await DoubtSession.findById(doubtSessionId);
  console.log(`🔍 Verified Session in DB: status = "${session.status}", chatRoomId = "${session.chatRoomId}"`);
  if (session.status !== "in_session" && session.status !== "mentor_selected") {
    throw new Error(`Expected session status to be 'in_session' or 'mentor_selected', got '${session.status}'`);
  }
  await mongoose.disconnect();

  // 6. Student ends the active session
  console.log("🏁 Student ending the active session...");
  const endRes = await fetch(`${BASE_URL}/student/end-session/${doubtSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
  });
  const endData = await endRes.json();
  if (endData.statusCode !== 200) {
    throw new Error(`End session failed: ${endData.message}`);
  }
  console.log("✅ Session ended successfully.\n");

  // Verify final status is 'completed'
  await mongoose.connect(config.MONGODB_URI);
  session = await DoubtSession.findById(doubtSessionId);
  console.log(`🔍 Verified Session in DB: status = "${session.status}", expiresAt = "${session.expiresAt}"`);
  if (session.status !== "completed") {
    throw new Error(`Expected session status to be 'completed', got '${session.status}'`);
  }
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! API WORK IS VERIFIED! 🎉");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ E2E Doubt Session test failed:", err);
  process.exit(1);
});
