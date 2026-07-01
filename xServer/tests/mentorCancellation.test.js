import mongoose from "mongoose";
import mentorService from "../src/services/mentor.service.js";
import { CommonUser } from "../src/models/AbaseUser.model.js";
import { DoubtSession } from "../src/models/doubtSession.model.js";
import mailService from "../src/services/MailService.js";

// Stub result email
mailService.sendResultEmail = async (email, subject, htmlContent) => {
    return { message: "Mocked email" };
};

async function testMentorCancellation() {
    try {
        console.log("Connecting to Database...");
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/solve-x");
        }

        console.log("Creating Test Data...");
        // Clean old test users
        await CommonUser.deleteMany({ email: /test_cancel_.*@test.com/ });
        await DoubtSession.deleteMany({ question: "Test Cancel Doubt" });

        const student = await CommonUser.create({
            name: "Test Student",
            email: "test_cancel_student@test.com",
            password: "password123",
            role: "student",
            isVerified: true
        });

        const mentor = await CommonUser.create({
            name: "Test Mentor",
            email: "test_cancel_mentor@test.com",
            password: "password123",
            role: "mentor",
            isVerified: true
        });

        const otherMentor = await CommonUser.create({
            name: "Other Mentor",
            email: "test_cancel_other@test.com",
            password: "password123",
            role: "mentor",
            isVerified: true
        });

        // 1. Create a confirmed scheduled doubt session
        const doubtSession = await DoubtSession.create({
            studentId: student._id,
            selectedMentorId: mentor._id,
            specializedId: new mongoose.Types.ObjectId(),
            question: "Test Cancel Doubt",
            sessionDuration: 30,
            status: "scheduled",
            sessionType: "scheduled",
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
        });

        // 2. Attempt cancellation without a reason (should throw error)
        console.log("Testing rejection without a reason...");
        try {
            await mentorService.rejectScheduledDoubt(mentor._id, doubtSession._id, "");
            throw new Error("Rejection without reason should have failed");
        } catch (err) {
            console.log("✓ Correctly caught expected error:", err.message);
            if (!err.message.includes("reason is required")) {
                throw new Error("Wrong error message for empty reason: " + err.message);
            }
        }

        // 3. Attempt cancellation by another mentor (should throw error)
        console.log("Testing rejection by unauthorized mentor...");
        try {
            await mentorService.rejectScheduledDoubt(otherMentor._id, doubtSession._id, "Valid reason");
            throw new Error("Unauthorized mentor should have failed to reject");
        } catch (err) {
            console.log("✓ Correctly caught expected error:", err.message);
            if (!err.message.includes("Access denied")) {
                throw new Error("Wrong error message for access denied: " + err.message);
            }
        }

        // 4. Successful cancellation by the assigned mentor
        console.log("Testing successful rejection by assigned mentor...");
        const result = await mentorService.rejectScheduledDoubt(mentor._id, doubtSession._id, "Emergency personal issue");
        console.log("Result:", result.message);

        const updatedSession = await DoubtSession.findById(doubtSession._id);
        console.log("Updated session status:", updatedSession.status);
        console.log("Updated session cancellationReason:", updatedSession.cancellationReason);

        if (updatedSession.status !== "expired") {
            throw new Error("Expected session status to be 'expired', got " + updatedSession.status);
        }

        if (updatedSession.cancellationReason !== "Emergency personal issue") {
            throw new Error("Expected cancellationReason 'Emergency personal issue', got " + updatedSession.cancellationReason);
        }

        console.log("🎉 ALL MENTOR CANCELLATION TESTS PASSED SUCCESSFULLY! ✅");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    } finally {
        await CommonUser.deleteMany({ email: /test_cancel_.*@test.com/ });
        await DoubtSession.deleteMany({ question: "Test Cancel Doubt" });
        await mongoose.connection.close();
        process.exit(0);
    }
}

testMentorCancellation();
