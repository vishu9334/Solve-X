import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { CommonUser } from "./src/models/AbaseUser.model.js";
import { SimpleUserAuth } from "./src/models/AuserAuth.model.js";
import { Skill } from "./src/models/skill.model.js";
import { DoubtSession } from "./src/models/doubtSession.model.js";
import config from "./src/configs/config.js";

dotenv.config();

const BASE_URL = "http://localhost:8000/api/v1";
const STUDENT_EMAIL = "student_test_route@solve-x.com";
const PASSWORD = "RouteTestPassword@123";

async function testStudentRoutes() {
  console.log("--------------------------------------------------");
  console.log("🧪 RUNNING TESTS FOR student.routes.js ENDPOINTS 🧪");
  console.log("--------------------------------------------------");

  // Connect to DB to set up a test student
  console.log("Connecting to Database...");
  await mongoose.connect(config.MONGODB_URI);
  
  // Clean up existing route-test user
  await CommonUser.deleteMany({ email: STUDENT_EMAIL });

  // Find Mern Stack skill
  const skill = await Skill.findOne({ name: "Mern Stack" });
  if (!skill) {
    throw new Error("Mern Stack skill needs to exist. Please seed the DB first.");
  }

  // Create Student
  const studentPasswordHash = await bcrypt.hash(PASSWORD, 10);
  const student = await SimpleUserAuth.create({
    name: "Route Test Student",
    email: STUDENT_EMAIL,
    username: "route_student_test",
    password: studentPasswordHash,
    role: "student",
    isVerified: true,
  });
  const studentId = student._id.toString();
  console.log(`Student user created with ID: ${studentId}\n`);

  await mongoose.disconnect();

  // Test Case 1: Unauthorized access to student routes (No token)
  console.log("❌ Test Case 1: Call without Authorization header");
  const unauthRes = await fetch(`${BASE_URL}/student/ask-doubt/${studentId}?skillIdentifier=${skill._id}&selectSessionTime=10`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typeWriteQuestion: "Test question without auth" }),
  });
  const unauthData = await unauthRes.json();
  console.log(`Status Code: ${unauthRes.status}`);
  console.log(`Response:`, JSON.stringify(unauthData), "\n");
  if (unauthRes.status !== 401) {
    throw new Error("Test Case 1 failed: Expected status code 401");
  }

  // Login to get valid token
  console.log("🔑 Logging in student to get Access Token...");
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  const studentToken = loginData.data.accessToken;
  console.log("Token obtained successfully.\n");

  // Test Case 2: Validation errors (Invalid ObjectIDs)
  console.log("❌ Test Case 2: Post doubt with invalid student ID");
  const invalidStudentId = "invalid_id_123";
  const badIdRes = await fetch(`${BASE_URL}/student/ask-doubt/${invalidStudentId}?skillIdentifier=${skill._id}&selectSessionTime=10`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ typeWriteQuestion: "Test question with bad student ID" }),
  });
  const badIdData = await badIdRes.json();
  console.log(`Status Code: ${badIdRes.status}`);
  console.log(`Response:`, JSON.stringify(badIdData), "\n");
  if (badIdRes.status !== 401) {
    throw new Error("Test Case 2 failed: Expected status code 401 (Mongoose validation throws 'Student id's not valid')");
  }

  // Test Case 3: Validation errors (Missing query or body fields)
  console.log("❌ Test Case 3: Post doubt with missing body fields");
  const missingFieldRes = await fetch(`${BASE_URL}/student/ask-doubt/${studentId}?skillIdentifier=${skill._id}&selectSessionTime=10`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({}), // Empty body (missing typeWriteQuestion)
  });
  const missingFieldData = await missingFieldRes.json();
  console.log(`Status Code: ${missingFieldRes.status}`);
  console.log(`Response:`, JSON.stringify(missingFieldData), "\n");
  if (missingFieldRes.status !== 400) {
    throw new Error("Test Case 3 failed: Expected status code 400");
  }

  // Test Case 4: Select mentor on a non-existent or invalid doubtSessionId
  console.log("❌ Test Case 4: Select mentor on non-existent doubtSessionId");
  const fakeSessionId = new mongoose.Types.ObjectId().toString();
  const fakeMentorId = new mongoose.Types.ObjectId().toString();
  const selectRes = await fetch(`${BASE_URL}/student/select-mentor/${fakeSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ selectedMentorId: fakeMentorId }),
  });
  const selectData = await selectRes.json();
  console.log(`Status Code: ${selectRes.status}`);
  console.log(`Response:`, JSON.stringify(selectData), "\n");
  if (selectRes.status !== 404) {
    throw new Error("Test Case 4 failed: Expected status code 404");
  }

  // Test Case 5: End session on non-existent doubtSessionId
  console.log("❌ Test Case 5: End session on non-existent doubtSessionId");
  const endRes = await fetch(`${BASE_URL}/student/end-session/${fakeSessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
  });
  const endData = await endRes.json();
  console.log(`Status Code: ${endRes.status}`);
  console.log(`Response:`, JSON.stringify(endData), "\n");
  if (endRes.status !== 404) {
    throw new Error("Test Case 5 failed: Expected status code 404");
  }

  console.log("🎉 ALL STUDENT ROUTE VALIDATION TESTS PASSED! 🎉");
}

testStudentRoutes().catch((err) => {
  console.error("❌ Test script failed:", err);
  process.exit(1);
});
