import mongoose from "mongoose";
import studentService from "../src/services/student.service.js";
import { MentorProfile } from "../src/models/AmentorProfile.model.js";
import { CommonUser } from "../src/models/AbaseUser.model.js";
import { DoubtSession } from "../src/models/doubtSession.model.js";
import mailService from "../src/services/MailService.js";

// Stub result email
mailService.sendResultEmail = async (email, subject, htmlContent) => {
    return { message: "Mocked email" };
};

async function testReschedulePenalties() {
    try {
        console.log("Connecting to Database...");
        // Wait, app.js might already handle connection, but let's connect manually just in case
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/solve-x");
        }

        console.log("Creating Test Data...");
        // Clean old test users
        await CommonUser.deleteMany({ email: /test_reschedule_.*@test.com/ });
        await DoubtSession.deleteMany({ question: "Test Reschedule Doubt" });

        const student = await CommonUser.create({
            name: "Test Student",
            email: "test_reschedule_student@test.com",
            password: "password123",
            role: "student",
            isVerified: true
        });

        const mentor = await CommonUser.create({
            name: "Test Mentor",
            email: "test_reschedule_mentor@test.com",
            password: "password123",
            role: "mentor",
            isVerified: true
        });

        const mentorProfile = await MentorProfile.create({
            userId: mentor._id,
            isVerifiedMentor: true
        });

        // 1. Create a doubt session and set it as scheduled
        const doubtSession = await DoubtSession.create({
            studentId: student._id,
            selectedMentorId: mentor._id,
            specializedId: new mongoose.Types.ObjectId(),
            question: "Test Reschedule Doubt",
            sessionDuration: 30,
            status: "scheduled",
            sessionType: "scheduled",
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
            rescheduleRequest: {
                proposedBy: student._id,
                newScheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
                status: "pending"
            }
        });

        console.log("Rejecting reschedule request 1st time...");
        await studentService.respondReschedule(mentor._id, doubtSession._id, "reject", "I am busy");
        
        let profile = await MentorProfile.findOne({ userId: mentor._id });
        console.log("Rejections count:", profile.rescheduleRejections.length);
        console.log("Warnings count:", profile.warnings.length);
        console.log("Penalties count:", profile.penalties.length);

        if (profile.rescheduleRejections.length !== 1) {
            throw new Error(`Expected 1 rejection, got ${profile.rescheduleRejections.length}`);
        }
        if (profile.warnings.length !== 1 || profile.warnings[0].warningType !== "rejection_warning") {
            throw new Error(`Expected warning warningType 'rejection_warning'`);
        }
        if (profile.penalties.length !== 0) {
            throw new Error(`Expected 0 penalties`);
        }

        // 2. Reject 2nd time
        doubtSession.rescheduleRequest = {
            proposedBy: student._id,
            newScheduledTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
            status: "pending"
        };
        await doubtSession.save();

        console.log("Rejecting reschedule request 2nd time...");
        await studentService.respondReschedule(mentor._id, doubtSession._id, "reject", "I am busy again");

        profile = await MentorProfile.findOne({ userId: mentor._id });
        console.log("Rejections count after 2nd:", profile.rescheduleRejections.length);
        console.log("Penalties count after 2nd:", profile.penalties.length);

        if (profile.rescheduleRejections.length !== 2) {
            throw new Error(`Expected 2 rejections`);
        }
        if (profile.penalties.length !== 0) {
            throw new Error(`Expected 0 penalties`);
        }

        // 3. Reject 3rd time (should apply 100 INR penalty)
        doubtSession.rescheduleRequest = {
            proposedBy: student._id,
            newScheduledTime: new Date(Date.now() + 96 * 60 * 60 * 1000),
            status: "pending"
        };
        await doubtSession.save();

        console.log("Rejecting reschedule request 3rd time...");
        await studentService.respondReschedule(mentor._id, doubtSession._id, "reject", "I am busy 3rd time");

        profile = await MentorProfile.findOne({ userId: mentor._id });
        console.log("Rejections count after 3rd:", profile.rescheduleRejections.length);
        console.log("Warnings count after 3rd:", profile.warnings.length);
        console.log("Penalties count after 3rd:", profile.penalties.length);

        if (profile.rescheduleRejections.length !== 3) {
            throw new Error(`Expected 3 rejections`);
        }
        if (profile.penalties.length !== 1 || profile.penalties[0].amount !== 100) {
            throw new Error(`Expected 1 penalty of 100 INR`);
        }
        if (profile.warnings.filter(w => w.warningType === "penalty_applied").length !== 1) {
            throw new Error(`Expected 1 warning warningType 'penalty_applied'`);
        }

        console.log("🎉 ALL RESCHEDULE PENALTY TESTS PASSED SUCCESSFULLY! ✅");
    } catch (err) {
        console.error("❌ TEST FAILED:", err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

testReschedulePenalties();
