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
const STUDENT_EMAIL = "print_student@solve-x.com";
const MENTOR_EMAIL = "print_mentor@solve-x.com";
const PASSWORD = "PrintPassword@123";

async function main() {
  console.log("Connecting to DB for setup...");
  await mongoose.connect(config.MONGODB_URI);
  await CommonUser.deleteMany({ email: { $in: [STUDENT_EMAIL, MENTOR_EMAIL] } });

  // Get Skill
  let skill = await Skill.findOne({ name: "Mern Stack" });
  if (!skill) {
    skill = await Skill.create({
      name: "Mern Stack",
      slug: "mern-stack",
      description: "MERN Stack",
      isActive: true,
      mentorCount: 0,
      source: "admin",
    });
  }

  // Create Student
  const hash = await bcrypt.hash(PASSWORD, 10);
  const student = await SimpleUserAuth.create({
    name: "John Student",
    email: STUDENT_EMAIL,
    username: "john_student",
    password: hash,
    role: "student",
    isVerified: true,
  });

  // Create Mentor
  const mentor = await SimpleUserAuth.create({
    name: "Alice Mentor",
    email: MENTOR_EMAIL,
    username: "alice_mentor",
    password: hash,
    role: "mentor",
    isVerified: true,
  });

  await MentorProfile.deleteMany({ userId: mentor._id });
  await MentorProfile.create({
    userId: mentor._id,
    skillCategory: skill._id,
    isVerifiedMentor: true,
    verificationStatus: "approved",
  });

  await mongoose.disconnect();
  console.log("DB seeded. Running endpoint requests...\n");

  // 1. LOGIN STUDENT
  const studentLoginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: PASSWORD }),
  });
  const studentLoginData = await studentLoginRes.json();
  const studentToken = studentLoginData.data.accessToken;

  // 2. LOGIN MENTOR
  const mentorLoginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: MENTOR_EMAIL, password: PASSWORD }),
  });
  const mentorLoginData = await mentorLoginRes.json();
  const mentorToken = mentorLoginData.data.accessToken;

  console.log("==================================================");
  console.log("1. ENDPOINT: POST /api/v1/student/ask-doubt/:userId");
  console.log("==================================================");
  const askDoubtUrl = `${BASE_URL}/student/ask-doubt/${student._id}?skillIdentifier=${skill._id}&selectSessionTime=15`;
  const askDoubtRes = await fetch(askDoubtUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ typeWriteQuestion: "How do I use populate in Mongoose?" }),
  });
  const askDoubtData = await askDoubtRes.json();
  console.log("Response Status:", askDoubtRes.status);
  console.log("Response Body:\n", JSON.stringify(askDoubtData, null, 2));
  console.log("\n");

  const doubtSessionId = askDoubtData.data.doubtSessionId;

  console.log("==================================================");
  console.log("2. ENDPOINT: POST /api/v1/mentor/reply-doubt");
  console.log("==================================================");
  const replyRes = await fetch(`${BASE_URL}/mentor/reply-doubt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      doubtSessionId,
      price: 300,
      availableTime: "In 5 minutes"
    }),
  });
  const replyData = await replyRes.json();
  console.log("Response Status:", replyRes.status);
  console.log("Response Body:\n", JSON.stringify(replyData, null, 2));
  console.log("\n");

  console.log("==================================================");
  console.log("3. ENDPOINT: POST /api/v1/student/select-mentor/:doubtSessionId");
  console.log("==================================================");
  const selectRes = await fetch(`${BASE_URL}/student/select-mentor/${doubtSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ selectedMentorId: mentor._id }),
  });
  const selectData = await selectRes.json();
  console.log("Response Status:", selectRes.status);
  console.log("Response Body:\n", JSON.stringify(selectData, null, 2));
  console.log("\n");

  console.log("==================================================");
  console.log("4. ENDPOINT: POST /api/v1/student/end-session/:doubtSessionId");
  console.log("==================================================");
  const endRes = await fetch(`${BASE_URL}/student/end-session/${doubtSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
  });
  const endData = await endRes.json();
  console.log("Response Status:", endRes.status);
  console.log("Response Body:\n", JSON.stringify(endData, null, 2));
  console.log("\n");
}

main().catch(console.error);
