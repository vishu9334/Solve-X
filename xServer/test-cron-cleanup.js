import mongoose from "mongoose";
import dotenv from "dotenv";
import { CommonUser } from "./src/models/AbaseUser.model.js";
import { SimpleUserAuth } from "./src/models/AuserAuth.model.js";
import { MentorProfile } from "./src/models/AmentorProfile.model.js";
import { Attempt } from "./src/models/assessmentAttempt.model.js";
import { Answer } from "./src/models/Answer.model.js";
import { AssessmentActivitySession } from "./src/models/assessmentActivityDataStore.model.js";
import config from "./src/configs/config.js";
import { runMentorCleanup } from "./src/cron/mentorCleanup.cron.js";

dotenv.config();

async function testCronCleanup() {
  console.log("--------------------------------------------------");
  console.log("🧪 TESTING UNVERIFIED MENTOR CLEANUP CRON TASK 🧪");
  console.log("--------------------------------------------------");

  console.log("Connecting to Database...");
  await mongoose.connect(config.MONGODB_URI);

  const MENTOR_A_EMAIL = "mentor_a_cleanup_test@solve-x.com";
  const MENTOR_B_EMAIL = "mentor_b_cleanup_test@solve-x.com";
  const MENTOR_C_EMAIL = "mentor_c_cleanup_test@solve-x.com";

  // 1. Cleanup any leftover test data first
  await CommonUser.deleteMany({ email: { $in: [MENTOR_A_EMAIL, MENTOR_B_EMAIL, MENTOR_C_EMAIL] } });
  
  const tempUserIds = [];

  // Helper to create users with custom createdAt dates
  const createUserWithProfile = async (email, name, daysAgo, isVerifiedMentor) => {
    const user = new SimpleUserAuth({
      name,
      email,
      username: email.split("@")[0],
      password: "TestPassword@123",
      role: "mentor",
      isVerified: true,
      authType: "SimpleUserAuth"
    });
    // Override createdAt
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    user.createdAt = date;
    user.updatedAt = date;
    await user.save();

    const profile = new MentorProfile({
      userId: user._id,
      isVerifiedMentor,
      verificationStatus: isVerifiedMentor ? "approved" : "pending",
      createdAt: date,
      updatedAt: date
    });
    await profile.save();

    tempUserIds.push(user._id);
    return { user, profile };
  };

  console.log("Creating test mentors...");

  // Mentor A: Registered 3 days ago, isVerifiedMentor = false (SHOULD BE CLEANED UP)
  const mentorA = await createUserWithProfile(MENTOR_A_EMAIL, "Mentor A (Old, Unverified)", 3, false);
  
  // Create associated mock assessment data for Mentor A to verify cascading deletes
  const dummyAssessmentId = new mongoose.Types.ObjectId();
  const attempt = await Attempt.create({
    userId: mentorA.user._id,
    assessmentId: dummyAssessmentId,
    status: "in_progress"
  });

  await Answer.create({
    userId: mentorA.user._id,
    attemptId: attempt._id,
    questionId: "q1",
    selectedAnswer: "A",
    isCorrect: true
  });

  await AssessmentActivitySession.create({
    userId: mentorA.user._id,
    category: "Mern Stack",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    assessmentId: dummyAssessmentId
  });

  // Mentor B: Registered 3 days ago, isVerifiedMentor = true (SHOULD NOT BE CLEANED UP)
  await createUserWithProfile(MENTOR_B_EMAIL, "Mentor B (Old, Verified)", 3, true);

  // Mentor C: Registered 1 day ago, isVerifiedMentor = false (SHOULD NOT BE CLEANED UP)
  await createUserWithProfile(MENTOR_C_EMAIL, "Mentor C (Recent, Unverified)", 1, false);

  console.log("Running mentor cleanup task manually...");
  await runMentorCleanup();

  // 2. VERIFY RESULTS
  console.log("\nVerifying database state after cleanup...");

  // Verify Mentor A (Should be deleted)
  const dbMentorAUser = await CommonUser.findOne({ email: MENTOR_A_EMAIL });
  const dbMentorAProfile = await MentorProfile.findOne({ userId: mentorA.user._id });
  const dbMentorAAttempts = await Attempt.find({ userId: mentorA.user._id });
  const dbMentorAAnswers = await Answer.find({ userId: mentorA.user._id });
  const dbMentorASessions = await AssessmentActivitySession.find({ userId: mentorA.user._id });

  let pass = true;

  if (dbMentorAUser || dbMentorAProfile) {
    console.error("❌ Test Failed: Mentor A was not deleted.");
    pass = false;
  } else {
    console.log("✅ Mentor A base user and profile deleted successfully.");
  }

  if (dbMentorAAttempts.length > 0 || dbMentorAAnswers.length > 0 || dbMentorASessions.length > 0) {
    console.error("❌ Test Failed: Mentor A's associated records were not fully cleaned up.");
    pass = false;
  } else {
    console.log("✅ Mentor A's associated attempts, answers, and activity sessions deleted successfully.");
  }

  // Verify Mentor B (Should NOT be deleted)
  const dbMentorBUser = await CommonUser.findOne({ email: MENTOR_B_EMAIL });
  const dbMentorBProfile = await MentorProfile.findOne({ userId: dbMentorBUser?._id });
  if (!dbMentorBUser || !dbMentorBProfile) {
    console.error("❌ Test Failed: Mentor B (Verified) was incorrectly deleted.");
    pass = false;
  } else {
    console.log("✅ Mentor B (Verified) was correctly retained.");
  }

  // Verify Mentor C (Should NOT be deleted)
  const dbMentorCUser = await CommonUser.findOne({ email: MENTOR_C_EMAIL });
  const dbMentorCProfile = await MentorProfile.findOne({ userId: dbMentorCUser?._id });
  if (!dbMentorCUser || !dbMentorCProfile) {
    console.error("❌ Test Failed: Mentor C (Recent, Unverified) was incorrectly deleted.");
    pass = false;
  } else {
    console.log("✅ Mentor C (Recent, Unverified) was correctly retained.");
  }

  // Clean up remaining test data
  await CommonUser.deleteMany({ email: { $in: [MENTOR_A_EMAIL, MENTOR_B_EMAIL, MENTOR_C_EMAIL] } });
  if (mentorA.user._id) {
    await Attempt.deleteMany({ userId: mentorA.user._id });
    await Answer.deleteMany({ userId: mentorA.user._id });
    await AssessmentActivitySession.deleteMany({ userId: mentorA.user._id });
  }

  await mongoose.disconnect();

  if (pass) {
    console.log("\n🎉 ALL CLEANUP CRON TEST CASES PASSED SUCCESSFULLY! 🎉\n");
    process.exit(0);
  } else {
    console.error("\n❌ CRON TEST FAILURES OCCURRED.\n");
    process.exit(1);
  }
}

testCronCleanup().catch((err) => {
  console.error("Test error:", err);
  mongoose.disconnect();
  process.exit(1);
});
