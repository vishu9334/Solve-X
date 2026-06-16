import mongoose from "mongoose";
import dotenv from "dotenv";
import { CommonUser } from "./src/models/AbaseUser.model.js";
import { SimpleUserAuth } from "./src/models/AuserAuth.model.js";
import { StudentProfile } from "./src/models/AstudentProfile.model.js";
import { MentorProfile } from "./src/models/AmentorProfile.model.js";
import { DoubtSession } from "./src/models/doubtSession.model.js";
import { Skill } from "./src/models/skill.model.js";
import TokenManager from "./src/utils/UTokenManager.util.js";
import config from "./src/configs/config.js";

dotenv.config();

const BASE_URL = "http://localhost:8001/api/v1";

async function testDashboard() {
  console.log("--------------------------------------------------");
  console.log("🧪 TESTING ROLE-BASED DASHBOARD APIS & PRICING 🧪");
  console.log("--------------------------------------------------");

  console.log("Connecting to Database...");
  await mongoose.connect(config.MONGODB_URI);

  const STUDENT_EMAIL = "student_dash_test@solve-x.com";
  const MENTOR_EMAIL = "mentor_dash_test@solve-x.com";
  const ADMIN_EMAIL = "admin_dash_test@solve-x.com";

  // Clean up existing test users/data
  const testEmails = [STUDENT_EMAIL, MENTOR_EMAIL, ADMIN_EMAIL];
  const testUsers = await CommonUser.find({ email: { $in: testEmails } });
  const testUserIds = testUsers.map(u => u._id);

  await CommonUser.deleteMany({ email: { $in: testEmails } });
  await StudentProfile.deleteMany({ userId: { $in: testUserIds } });
  await MentorProfile.deleteMany({ userId: { $in: testUserIds } });
  await DoubtSession.deleteMany({ studentId: { $in: testUserIds } });
  await DoubtSession.deleteMany({ selectedMentorId: { $in: testUserIds } });

  // 1. Create a Student
  const student = await SimpleUserAuth.create({
    name: "Dashboard Student",
    email: STUDENT_EMAIL,
    username: "dash_student",
    password: "Password123",
    role: "student",
    isVerified: true
  });
  const studentProfile = await StudentProfile.create({
    userId: student._id,
    bio: "Student tester",
    subscriptionStatus: "active",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
  });

  // Ensure Skill Category exists
  let skill = await Skill.findOne({ name: "Mern Stack" });
  if (!skill) {
    skill = await Skill.create({
      name: "Mern Stack",
      slug: "mern-stack",
      description: "Mern Stack Development",
      isActive: true,
      mentorCount: 1,
      source: "admin"
    });
  }

  // 2. Create a Mentor
  const mentor = await SimpleUserAuth.create({
    name: "Dashboard Mentor",
    email: MENTOR_EMAIL,
    username: "dash_mentor",
    password: "Password123",
    role: "mentor",
    isVerified: true
  });
  const mentorProfile = await MentorProfile.create({
    userId: mentor._id,
    skillCategory: skill._id,
    isVerifiedMentor: true,
    verificationStatus: "approved",
    verifiedAt: new Date()
  });

  // Update Skill mentor count
  skill.mentorCount = (skill.mentorCount || 0) + 1;
  await skill.save();

  // 3. Create an Admin
  const admin = await SimpleUserAuth.create({
    name: "Dashboard Admin",
    email: ADMIN_EMAIL,
    username: "dash_admin",
    password: "Password123",
    role: "admin",
    isVerified: true
  });

  // 4. Create a completed Doubt Session (proving ₹20 offer pricing)
  const session = await DoubtSession.create({
    studentId: student._id,
    skillId: skill._id,
    question: "How to fix useEffect dependency array issue?",
    sessionDuration: 15,
    status: "completed",
    selectedMentorId: mentor._id,
    mentorOffers: [
      {
        mentorId: mentor._id,
        mentorName: mentor.name,
        price: 20, // Enforced pricing
        availableTime: "Immediate"
      }
    ],
    sessionStartedAt: new Date(Date.now() - 30 * 60 * 1000),
    sessionEndedAt: new Date(Date.now() - 15 * 60 * 1000)
  });

  console.log("Test data seeded successfully.");

  // Generate Access Tokens directly to bypass login endpoints
  const studentToken = TokenManager.generateAccessToken({ userId: student._id });
  const mentorToken = TokenManager.generateAccessToken({ userId: mentor._id });
  const adminToken = TokenManager.generateAccessToken({ userId: admin._id });

  // Disconnect from database to run web API calls
  await mongoose.disconnect();
  console.log("Database disconnected. Fetching endpoints...\n");

  let pass = true;

  // Helper fetch function
  const fetchDashboard = async (endpoint, token) => {
    const res = await fetch(`${BASE_URL}/dashboard/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // --- STUDENT DASHBOARD TESTS ---
  console.log("🔍 Test 1: Fetching Student Dashboard...");
  const sDash = await fetchDashboard("student", studentToken);
  console.log("Student Dashboard Status:", sDash.status);
  if (sDash.status !== 200) {
    console.error("❌ Student Dashboard fetch failed:", sDash.data);
    pass = false;
  } else {
    console.log("✅ Student Dashboard Status OK.");
    const payload = sDash.data.data;
    if (payload.profile.subscriptionStatus !== "active") {
      console.error("❌ Subscription status incorrect. Expected 'active', got:", payload.profile.subscriptionStatus);
      pass = false;
    } else {
      console.log("✅ Subscription status verified: active");
    }
    if (payload.stats.totalAsked !== 1 || payload.stats.completedAsked !== 1) {
      console.error("❌ Doubt stats count incorrect:", payload.stats);
      pass = false;
    } else {
      console.log("✅ Doubt stats verified successfully.");
    }
  }

  // --- STUDENT DASHBOARD ACCESS SECURITY ---
  console.log("\n🔒 Test 2: Verify Mentor cannot access Student Dashboard...");
  const invalidAccess = await fetchDashboard("student", mentorToken);
  console.log("Response Status:", invalidAccess.status);
  if (invalidAccess.status !== 403) {
    console.error("❌ Security check failed! Expected 403, got:", invalidAccess.status);
    pass = false;
  } else {
    console.log("✅ Security check passed. Access forbidden for other roles.");
  }

  // --- MENTOR DASHBOARD TESTS ---
  console.log("\n🔍 Test 3: Fetching Mentor Dashboard...");
  const mDash = await fetchDashboard("mentor", mentorToken);
  console.log("Mentor Dashboard Status:", mDash.status);
  if (mDash.status !== 200) {
    console.error("❌ Mentor Dashboard fetch failed:", mDash.data);
    pass = false;
  } else {
    console.log("✅ Mentor Dashboard Status OK.");
    const payload = mDash.data.data;
    if (!payload.profile.isVerifiedMentor) {
      console.error("❌ Mentor profile verification state incorrect.");
      pass = false;
    } else {
      console.log("✅ Mentor verification status verified: approved");
    }
    if (payload.stats.totalEarnings !== 20 || payload.stats.totalResolved !== 1) {
      console.error("❌ Mentor earning stats incorrect. Expected ₹20 earnings, got:", payload.stats);
      pass = false;
    } else {
      console.log("✅ Mentor earnings successfully verified: ₹20");
    }
  }

  // --- ADMIN DASHBOARD TESTS ---
  console.log("\n🔍 Test 4: Fetching Admin Dashboard...");
  const aDash = await fetchDashboard("admin", adminToken);
  console.log("Admin Dashboard Status:", aDash.status);
  if (aDash.status !== 200) {
    console.error("❌ Admin Dashboard fetch failed:", aDash.data);
    pass = false;
  } else {
    console.log("✅ Admin Dashboard Status OK.");
    const payload = aDash.data.data;
    if (payload.subscriptions.activeSubscriptions < 1) {
      console.error("❌ Active subscriptions stats incorrect in Admin:", payload.subscriptions);
      pass = false;
    } else {
      console.log("✅ Admin active subscriptions count verified.");
    }
    if (payload.users.totalStudents < 1 || payload.users.totalMentors < 1) {
      console.error("❌ Users breakdown stats incorrect in Admin:", payload.users);
      pass = false;
    } else {
      console.log("✅ Admin user role stats verified.");
    }
  }

  // Clean up database records
  console.log("\nReconnecting to Database for cleanup...");
  await mongoose.connect(config.MONGODB_URI);
  await CommonUser.deleteMany({ email: { $in: testEmails } });
  await StudentProfile.deleteMany({ userId: { $in: testUserIds } });
  await MentorProfile.deleteMany({ userId: { $in: testUserIds } });
  await DoubtSession.deleteMany({ studentId: { $in: testUserIds } });
  await DoubtSession.deleteMany({ selectedMentorId: { $in: testUserIds } });
  await mongoose.disconnect();
  console.log("Cleanup completed.");

  if (pass) {
    console.log("\n🎉 ALL DASHBOARD & PRICING TEST CASES PASSED SUCCESSFULLY! 🎉\n");
    process.exit(0);
  } else {
    console.error("\n❌ TEST FAILURES OCCURRED.\n");
    process.exit(1);
  }
}

testDashboard().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
