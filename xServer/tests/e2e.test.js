import mongoose from "mongoose";
import http from "http";
import { io as ioClient } from "socket.io-client";
import { app } from "../src/app.js";
import { initSocket } from "../src/helpers/socket/socket.helper.js";
import mailService from "../src/services/MailService.js";
import redis from "../src/configs/redis.config.js";
import config from "../src/configs/config.js";
import emailQueue from "../src/queue/email.queue.js";
import emailWorker from "../src/workers/email.worker.js";
import bullmqRedisConnection from "../src/configs/bullmqRedis.config.js";

const PORT = 8002;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Setup OTP interception map
const otpMap = new Map();
mailService.sendOtpEmail = async (email, otp) => {
  console.log(`[STUB] Intercepted OTP for ${email}: ${otp}`);
  otpMap.set(email, otp);
  return { message: "Mocked OTP send success" };
};

// We also stub sendResultEmail to prevent outbound API calls to Brevo
mailService.sendResultEmail = async (email, subject, htmlContent) => {
  console.log(`[STUB] Intercepted result email to ${email} (Subject: ${subject})`);
  return { message: "Mocked result email success" };
};

let server;
let studentSocket;
let mentorSocket;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("\n==============================================");
  console.log("🚀 STARTING E2E API AND WEBOCKET TEST SUITE");
  console.log("==============================================\n");

  try {
    // Connect Mongoose if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGODB_URI);
      console.log("✅ Connected to MongoDB");
    }

    // Start HTTP Server and Socket.IO
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`✅ Test server running on http://localhost:${PORT}`);

    // Wait a brief moment to stabilize
    await sleep(1000);

    // --- STEP 1: Register Student ---
    console.log("\n🔹 Step 1: Registering Student...");
    const studentEmail = `student_${Date.now()}@solve-x.com`;
    const regStudentRes = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: studentEmail,
        password: "Password123!",
        role: "student",
      }),
    });
    const regStudentData = await regStudentRes.json();
    console.log("Student Reg Response:", regStudentData);
    if (regStudentRes.status !== 200) throw new Error("Student registration failed");

    // Set OTP directly to static 9999 under test mode
    const studentOtp = "9999";
    console.log(`Student OTP set to: ${studentOtp}`);

    // --- STEP 2: Verify Student OTP & Get Token ---
    console.log("\n🔹 Step 2: Verifying Student OTP...");
    const verifyStudentRes = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail,
        otp: studentOtp,
      }),
    });
    const verifyStudentData = await verifyStudentRes.json();
    console.log("Student Verify Response:", verifyStudentData.message);
    if (verifyStudentRes.status !== 200) throw new Error("Student OTP verification failed");
    const studentTokenHeader = verifyStudentRes.headers.get("Authorization");
    const studentToken = studentTokenHeader ? studentTokenHeader.replace("Bearer ", "") : null;
    const studentId = verifyStudentData.data.userObj._id;
    console.log(`Student Token: ${studentToken ? studentToken.substring(0, 15) : "NULL"}...`);
    console.log(`Student ID: ${studentId}`);

    // --- STEP 3: Register Mentor ---
    console.log("\n🔹 Step 3: Registering Mentor...");
    const mentorEmail = `mentor_${Date.now()}@solve-x.com`;
    const regMentorRes = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Mentor",
        email: mentorEmail,
        password: "Password123!",
        role: "mentor",
      }),
    });
    const regMentorData = await regMentorRes.json();
    console.log("Mentor Reg Response:", regMentorData);
    if (regMentorRes.status !== 200) throw new Error("Mentor registration failed");

    // Set OTP directly to static 9999 under test mode
    const mentorOtp = "9999";
    console.log(`Mentor OTP set to: ${mentorOtp}`);

    // --- STEP 4: Verify Mentor OTP & Get Token ---
    console.log("\n🔹 Step 4: Verifying Mentor OTP...");
    const verifyMentorRes = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: mentorEmail,
        otp: mentorOtp,
      }),
    });
    const verifyMentorData = await verifyMentorRes.json();
    console.log("Mentor Verify Response:", verifyMentorData.message);
    if (verifyMentorRes.status !== 200) throw new Error("Mentor OTP verification failed");
    const mentorTokenHeader = verifyMentorRes.headers.get("Authorization");
    const mentorToken = mentorTokenHeader ? mentorTokenHeader.replace("Bearer ", "") : null;
    const mentorId = verifyMentorData.data.userObj._id;
    console.log(`Mentor Token: ${mentorToken.substring(0, 15)}...`);
    console.log(`Mentor ID: ${mentorId}`);

    // --- STEP 5: Initialize WebSockets & Register Users ---
    console.log("\n🔹 Step 5: Connecting Socket.IO Client Sockets...");
    studentSocket = ioClient(`http://localhost:${PORT}`);
    mentorSocket = ioClient(`http://localhost:${PORT}`);

    await new Promise((resolve) => {
      let connectedCount = 0;
      const checkResolve = () => {
        connectedCount++;
        if (connectedCount === 2) resolve();
      };
      studentSocket.on("connect", checkResolve);
      mentorSocket.on("connect", checkResolve);
    });
    console.log("✅ Both Student and Mentor WebSocket clients connected");

    studentSocket.emit("register_user", studentId);
    mentorSocket.emit("register_user", mentorId);
    console.log(`✅ Registered users with Sockets`);

    // Setup Socket Event Listeners for E2E validation
    const studentEvents = [];
    const mentorEvents = [];
    studentSocket.on("mentor_offer_received", (payload) => {
      console.log("📥 [SOCKET EVENT] Student received mentor_offer_received:", payload);
      studentEvents.push({ event: "mentor_offer_received", payload });
    });
    studentSocket.on("join_chat_room", (payload) => {
      console.log("📥 [SOCKET EVENT] Student received join_chat_room:", payload);
      studentEvents.push({ event: "join_chat_room", payload });
    });
    studentSocket.on("receive_chat_message", (payload) => {
      console.log("📥 [SOCKET EVENT] Student received receive_chat_message:", payload);
      studentEvents.push({ event: "receive_chat_message", payload });
    });
    studentSocket.on("session_ended", (payload) => {
      console.log("📥 [SOCKET EVENT] Student received session_ended:", payload);
      studentEvents.push({ event: "session_ended", payload });
    });

    mentorSocket.on("student_asked_question", (payload) => {
      console.log("📥 [SOCKET EVENT] Mentor received student_asked_question:", payload);
      mentorEvents.push({ event: "student_asked_question", payload });
    });
    mentorSocket.on("mentor_selected_for_doubt", (payload) => {
      console.log("📥 [SOCKET EVENT] Mentor received mentor_selected_for_doubt:", payload);
      mentorEvents.push({ event: "mentor_selected_for_doubt", payload });
    });
    mentorSocket.on("join_chat_room", (payload) => {
      console.log("📥 [SOCKET EVENT] Mentor received join_chat_room:", payload);
      mentorEvents.push({ event: "join_chat_room", payload });
    });
    mentorSocket.on("receive_chat_message", (payload) => {
      console.log("📥 [SOCKET EVENT] Mentor received receive_chat_message:", payload);
      mentorEvents.push({ event: "receive_chat_message", payload });
    });
    mentorSocket.on("session_ended", (payload) => {
      console.log("📥 [SOCKET EVENT] Mentor received session_ended:", payload);
      mentorEvents.push({ event: "session_ended", payload });
    });

    // --- STEP 6: Mentor Selects Skill & Generates MCQ ---
    console.log("\n🔹 Step 6: Mentor selecting skill 'Mern Stack'...");
    const selectSkillRes = await fetch(`${BASE_URL}/mentor/select-skill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        skillName: "Mern Stack",
      }),
    });
    const selectSkillData = await selectSkillRes.json();
    console.log("Select Skill Response Status:", selectSkillRes.status);
    if (selectSkillRes.status !== 200) throw new Error("Mentor select-skill failed");
    const attemptId = selectSkillData.data.attempt._id;
    const questions = selectSkillData.data.questions.questions;
    console.log(`Generated Questions count: ${questions.length}`);
    console.log(`Attempt ID: ${attemptId}`);

    // Print Attempt status immediately after select skill
    const attemptAfterSelect = await mongoose.model("Attempt").findById(attemptId);
    console.log("[DB DEBUG] Attempt status after select-skill:", attemptAfterSelect?.status, attemptAfterSelect);

    // --- STEP 7: Mentor Starts Proctoring Session ---
    console.log("\n🔹 Step 7: Mentor starting proctoring session...");
    const startProctorRes = await fetch(`${BASE_URL}/activity-sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        category: "Mern Stack",
        screen: { innerWidth: 1024, innerHeight: 768, isFullscreen: true },
      }),
    });
    const startProctorData = await startProctorRes.json();
    console.log("Start Proctoring Response:", startProctorData);
    if (startProctorRes.status !== 201) throw new Error("Start proctoring failed");
    const proctorSessionId = startProctorData.data._id;
    console.log(`Proctoring Session ID: ${proctorSessionId}`);

    // Print ActivitySession immediately after start
    const sessionAfterStart = await mongoose.model("AssessmentActivitySession").findById(proctorSessionId);
    console.log("[DB DEBUG] Session status after start:", sessionAfterStart?.endedAt, sessionAfterStart);

    // --- STEP 8: Mentor Logs Proctoring Event ---
    console.log("\n🔹 Step 8: Mentor recording window blur activity event...");
    const recordEventRes = await fetch(`${BASE_URL}/activity-sessions/${proctorSessionId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        eventType: "WINDOW_BLUR",
        message: "User clicked away from browser window",
        screen: { innerWidth: 1024, innerHeight: 768, isFullscreen: false },
      }),
    });
    const recordEventData = await recordEventRes.json();
    console.log("Record Event Response:", recordEventData);
    if (recordEventRes.status !== 200) throw new Error("Record activity event failed");

    // Print Attempt and Session status immediately after recording event
    const attemptAfterEvent = await mongoose.model("Attempt").findById(attemptId);
    console.log("[DB DEBUG] Attempt status after event:", attemptAfterEvent?.status, attemptAfterEvent);
    const sessionAfterEvent = await mongoose.model("AssessmentActivitySession").findById(proctorSessionId);
    console.log("[DB DEBUG] Session status after event:", sessionAfterEvent?.endedAt, sessionAfterEvent);

    // --- STEP 9: Mentor Submits Assessment Answers (Passing Score) ---
    console.log("\n🔹 Step 9: Mentor submitting correct answers for assessment...");
    const answers = questions.map((q) => ({
      questionId: q.questionText,
      selectedAnswer: q.correctAnswer,
    }));
    const submitAssessmentRes = await fetch(`${BASE_URL}/mentor/submit-assessment/${attemptId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({ answers }),
    });
    const submitAssessmentData = await submitAssessmentRes.json();
    console.log("Submit Assessment Response:", submitAssessmentData);
    if (submitAssessmentRes.status !== 200) throw new Error("Submit assessment failed");
    console.log("Assessment Result:", submitAssessmentData.data.attemptStatus);
    console.log("Evaluation details:", submitAssessmentData.data.evaluation);

    await sleep(2000); // Allow email queues to clean up

    // Fetch skill from database to get its ObjectId
    const mernSkill = await mongoose.model("Skill").findOne({ name: "Mern Stack" });
    const mernSkillId = mernSkill ? mernSkill._id.toString() : "";
    console.log(`Resolved Mern Stack Skill ID: ${mernSkillId}`);

    // --- STEP 10: Student Asks a Doubt ---
    console.log("\n🔹 Step 10: Student asking Mern Stack doubt (optional userId in route tested)...");
    const askDoubtRes = await fetch(`${BASE_URL}/student/ask-doubt?skillIdentifier=${mernSkillId}&selectSessionTime=10`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        typeWriteQuestion: "How do I configure Socket.IO CORS in Express?",
      }),
    });
    const askDoubtData = await askDoubtRes.json();
    console.log("Ask Doubt Response:", askDoubtData);
    if (askDoubtRes.status !== 200) throw new Error("Student ask-doubt failed");
    const doubtSessionId = askDoubtData.data.doubtSessionId;
    console.log(`Doubt Session ID: ${doubtSessionId}`);

    // Wait and check if Mentor Socket received 'student_asked_question'
    await sleep(2000);
    const askedQuestionEvent = mentorEvents.find((e) => e.event === "student_asked_question");
    if (!askedQuestionEvent) throw new Error("Mentor socket did not receive 'student_asked_question'");
    console.log("✨ Socket Verified: Mentor successfully received 'student_asked_question'!");

    // --- STEP 11: Mentor Sends an Offer (Bid) ---
    console.log("\n🔹 Step 11: Mentor replying to student doubt (sending offer)...");
    const replyDoubtRes = await fetch(`${BASE_URL}/mentor/reply-doubt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        doubtSessionId,
        price: 20,
        availableTime: "Immediate",
      }),
    });
    const replyDoubtData = await replyDoubtRes.json();
    console.log("Reply Doubt Response:", replyDoubtData);
    if (replyDoubtRes.status !== 200) throw new Error("Mentor reply-doubt failed");

    // Wait and check if Student Socket received 'mentor_offer_received'
    await sleep(2000);
    const offerReceivedEvent = studentEvents.find((e) => e.event === "mentor_offer_received");
    if (!offerReceivedEvent) throw new Error("Student socket did not receive 'mentor_offer_received'");
    console.log("✨ Socket Verified: Student successfully received 'mentor_offer_received'!");

    // --- STEP 12: Student Fetches Doubt Session Details & Offers ---
    console.log("\n🔹 Step 12: Student fetching active doubt session & offers...");
    const offersRes = await fetch(`${BASE_URL}/student/doubt-sessions/${doubtSessionId}/offers`, {
      headers: { "Authorization": `Bearer ${studentToken}` },
    });
    const offersData = await offersRes.json();
    console.log("Doubt Session Offers List count:", offersData.data.length);
    if (offersRes.status !== 200) throw new Error("Fetch doubt session offers failed");

    const detailsRes = await fetch(`${BASE_URL}/student/doubt-sessions/${doubtSessionId}`, {
      headers: { "Authorization": `Bearer ${studentToken}` },
    });
    const detailsData = await detailsRes.json();
    console.log("Doubt Session Status:", detailsData.data.status);
    if (detailsRes.status !== 200) throw new Error("Fetch doubt session details failed");

    // --- STEP 13: Student Selects Mentor ---
    console.log("\n🔹 Step 13: Student accepting mentor's offer...");
    const selectMentorRes = await fetch(`${BASE_URL}/student/select-mentor/${doubtSessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        selectedMentorId: mentorId,
      }),
    });
    const selectMentorData = await selectMentorRes.json();
    console.log("Select Mentor Response:", selectMentorData);
    if (selectMentorRes.status !== 200) throw new Error("Student select-mentor failed");
    const chatRoomId = selectMentorData.data.chatRoomId;
    console.log(`Chat Room ID: ${chatRoomId}`);

    // Wait and check if Mentor Socket received 'mentor_selected_for_doubt'
    await sleep(2000);
    const selectedForDoubtEvent = mentorEvents.find((e) => e.event === "mentor_selected_for_doubt");
    if (!selectedForDoubtEvent) throw new Error("Mentor socket did not receive 'mentor_selected_for_doubt'");
    console.log("✨ Socket Verified: Mentor successfully received 'mentor_selected_for_doubt'!");

    // --- STEP 14: WebSocket Bidirectional Chat Check ---
    console.log("\n🔹 Step 14: Simulating bidirectional chat room message...");
    // Both join the room
    studentSocket.emit("join_chat_room", { chatRoomId, userId: studentId });
    mentorSocket.emit("join_chat_room", { chatRoomId, userId: mentorId });
    await sleep(1000);

    // Student sends a message
    studentSocket.emit("send_chat_message", {
      chatRoomId,
      senderId: studentId,
      message: "Hello mentor, need help with CORS config!",
    });

    // Wait and check if Mentor Socket received the chat message
    await sleep(2000);
    const chatMsgReceived = mentorEvents.some(
      (e) => e.event === "receive_chat_message" && e.payload.message.includes("CORS config")
    );
    if (!chatMsgReceived) throw new Error("Mentor socket did not receive the student chat message");
    console.log("✨ Socket Verified: Mentor successfully received student's live chat message!");

    // --- STEP 15: Concurrency Protection Check ---
    console.log("\n🔹 Step 15: Verifying Concurrency Booking Protection...");
    // Create another student to attempt to book the SAME mentor who is already in_session
    const secondStudentEmail = `student2_${Date.now()}@solve-x.com`;
    const regStudent2Res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Second Student",
        email: secondStudentEmail,
        password: "Password123!",
        role: "student",
      }),
    });
    const regStudent2Data = await regStudent2Res.json();
    const student2Otp = "9999";
    
    const verifyStudent2Res = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: secondStudentEmail,
        otp: student2Otp,
      }),
    });
    const verifyStudent2Data = await verifyStudent2Res.json();
    const student2TokenHeader = verifyStudent2Res.headers.get("Authorization");
    const student2Token = student2TokenHeader ? student2TokenHeader.replace("Bearer ", "") : null;

    // Second student asks doubt in Mern Stack
    const askDoubt2Res = await fetch(`${BASE_URL}/student/ask-doubt?skillIdentifier=${mernSkillId}&selectSessionTime=10`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${student2Token}`,
      },
      body: JSON.stringify({ typeWriteQuestion: "Another CORS question" }),
    });
    const askDoubt2Data = await askDoubt2Res.json();
    const doubtSession2Id = askDoubt2Data.data.doubtSessionId;

    // Mentor tries to send offer to second student - should fail because mentor is in active session
    console.log("Mentor tries to bid on second doubt (should be restricted)...");
    const replyDoubt2Res = await fetch(`${BASE_URL}/mentor/reply-doubt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        doubtSessionId: doubtSession2Id,
        price: 20,
        availableTime: "Immediate",
      }),
    });
    const replyDoubt2Data = await replyDoubt2Res.json();
    console.log("Double booking reply doubt status code:", replyDoubt2Res.status);
    console.log("Double booking reply doubt message:", replyDoubt2Data.message);
    if (replyDoubt2Res.status !== 400) {
      throw new Error("Concurrency booking protection failed: Mentor was able to reply to a doubt while in active session!");
    }
    console.log("✨ Concurrency booking protection verified successfully!");

    // --- STEP 16: Student Ends Session ---
    console.log("\n🔹 Step 16: Student ending the active doubt session...");
    const endSessionRes = await fetch(`${BASE_URL}/student/end-session/${doubtSessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`,
      },
    });
    const endSessionData = await endSessionRes.json();
    console.log("End Session Response:", endSessionData);
    if (endSessionRes.status !== 200) throw new Error("Student end-session failed");

    // Wait and check if Mentor Socket received 'session_ended'
    await sleep(2000);
    const sessionEndedEvent = mentorEvents.find((e) => e.event === "session_ended");
    if (!sessionEndedEvent) throw new Error("Mentor socket did not receive 'session_ended' notification");
    console.log("✨ Socket Verified: Mentor successfully received 'session_ended'!");

    // --- STEP 17: Fetch Dashboards & Validate Stats ---
    console.log("\n🔹 Step 17: Validating dashboards...");
    const studentDashRes = await fetch(`${BASE_URL}/dashboard/student`, {
      headers: { "Authorization": `Bearer ${studentToken}` },
    });
    const studentDashData = await studentDashRes.json();
    console.log("Student Dashboard stats:", studentDashData.data.stats);
    if (studentDashRes.status !== 200) throw new Error("Fetch student dashboard failed");

    const mentorDashRes = await fetch(`${BASE_URL}/dashboard/mentor`, {
      headers: { "Authorization": `Bearer ${mentorToken}` },
    });
    const mentorDashData = await mentorDashRes.json();
    console.log("Mentor Dashboard earnings:", mentorDashData.data.stats.totalEarnings);
    if (mentorDashRes.status !== 200) throw new Error("Fetch mentor dashboard failed");
    if (mentorDashData.data.stats.totalEarnings !== 20) {
      throw new Error(`Earnings calculation incorrect. Expected 20, got ${mentorDashData.data.stats.totalEarnings}`);
    }

    const adminLoginRes = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "connect.solvex99@gmail.com",
        password: "AdminPassword@123",
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminTokenHeader = adminLoginRes.headers.get("Authorization");
    const adminToken = adminTokenHeader ? adminTokenHeader.replace("Bearer ", "") : null;

    const adminDashRes = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { "Authorization": `Bearer ${adminToken}` },
    });
    const adminDashData = await adminDashRes.json();
    console.log("Admin Dashboard stats:", adminDashData.data.doubtSessions);
    if (adminDashRes.status !== 200) throw new Error("Fetch admin dashboard failed");

    // --- STEP 18: Logout ---
    console.log("\n🔹 Step 18: Logging out all test users...");
    const logoutStudentRes = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${studentToken}` },
    });
    console.log("Student Logout response status:", logoutStudentRes.status);
    if (logoutStudentRes.status !== 200) throw new Error("Student logout failed");

    const logoutMentorRes = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${mentorToken}` },
    });
    console.log("Mentor Logout response status:", logoutMentorRes.status);
    if (logoutMentorRes.status !== 200) throw new Error("Mentor logout failed");

    console.log("\n==============================================");
    console.log("🎉 ALL E2E TESTS PASSED SUCCESSFULLY! ✅");
    console.log("==============================================\n");
  } catch (error) {
    console.error("\n❌ E2E TEST SUITE FAILED:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    console.log("🔌 Cleaning up test resources...");

    // Disconnect clients
    if (studentSocket) studentSocket.disconnect();
    if (mentorSocket) mentorSocket.disconnect();

    // Close BullMQ worker & queue
    try {
      console.log("Closing BullMQ queue...");
      await emailQueue.close();
      console.log("Closing BullMQ worker...");
      await emailWorker.close();
      console.log("Disconnecting BullMQ connection...");
      await bullmqRedisConnection.quit();
    } catch (e) {
      console.warn("BullMQ cleanup warning:", e.message);
    }

    // Disconnect Redis
    try {
      await redis.quit();
      console.log("Redis disconnected");
    } catch (e) {
      console.warn("Redis disconnect warning:", e.message);
    }

    // Close Server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("Test HTTP Server closed");
    }

    // Disconnect DB
    await mongoose.disconnect();
    console.log("MongoDB disconnected. Cleanup complete.");
    process.exit(process.exitCode || 0);
  }
}

runTests();
