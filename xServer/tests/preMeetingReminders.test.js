import mongoose from "mongoose";
import { checkScheduledSessions } from "../src/cron/scheduledDoubt.cron.js";
import { CommonUser } from "../src/models/AbaseUser.model.js";
import { DoubtSession } from "../src/models/doubtSession.model.js";
import mailService from "../src/services/MailService.js";
import redis from "../src/configs/redis.config.js";

// Stub email service
let emailsSent = [];
mailService.sendResultEmail = async (email, subject, htmlContent) => {
    emailsSent.push({ email, subject, htmlContent });
    return { message: "Mocked email" };
};

async function testPreMeetingReminders() {
    try {
        console.log("Connecting to Database...");
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/solve-x");
        }

        console.log("Creating Test Data...");
        await CommonUser.deleteMany({ email: /test_reminder_.*@test.com/ });
        await DoubtSession.deleteMany({ question: "Test Reminder Doubt" });

        const student = await CommonUser.create({
            name: "Test Student",
            email: "test_reminder_student@test.com",
            password: "password123",
            role: "student",
            isVerified: true
        });

        const mentor = await CommonUser.create({
            name: "Test Mentor",
            email: "test_reminder_mentor@test.com",
            password: "password123",
            role: "mentor",
            isVerified: true
        });

        // Clear pre-existing redis keys just in case
        await redis.del(`reminder:1h:6a43eaceedf75f010e86ae41`);

        // 1. Create a scheduled doubt session 60 minutes in the future
        console.log("Creating session scheduled for 60 minutes in the future...");
        const session1h = await DoubtSession.create({
            studentId: student._id,
            selectedMentorId: mentor._id,
            specializedId: new mongoose.Types.ObjectId(),
            question: "Test Reminder Doubt",
            sessionDuration: 30,
            status: "scheduled",
            sessionType: "scheduled",
            scheduledTime: new Date(Date.now() + 60 * 60 * 1000) // Exactly 1 hour from now
        });

        // Clear redis key for new session ID
        await redis.del(`reminder:1h:${session1h._id}`);

        emailsSent = [];
        console.log("Running cron to check scheduled sessions (should trigger 1-hour reminder)...");
        await checkScheduledSessions();

        const redisKey1h = await redis.get(`reminder:1h:${session1h._id}`);
        console.log("Redis key reminderSent1h value:", redisKey1h);
        console.log("Emails sent count:", emailsSent.length);

        if (redisKey1h !== "true") {
            throw new Error("Expected Redis key reminder:1h to be true");
        }
        if (emailsSent.length !== 2) {
            throw new Error(`Expected 2 emails (student & mentor), got ${emailsSent.length}`);
        }
        if (!emailsSent[0].subject.includes("Starts in 1 Hour")) {
            throw new Error("Wrong email subject for 1-hour reminder");
        }

        // Running again should not send duplicates
        emailsSent = [];
        console.log("Running cron again (should not trigger duplicate 1-hour reminder)...");
        await checkScheduledSessions();
        console.log("Emails sent on 2nd run:", emailsSent.length);
        if (emailsSent.length !== 0) {
            throw new Error("Duplicate 1-hour reminders were sent!");
        }

        // 2. Create a scheduled doubt session 5 minutes in the future
        console.log("Creating session scheduled for 5 minutes in the future...");
        const session5m = await DoubtSession.create({
            studentId: student._id,
            selectedMentorId: mentor._id,
            specializedId: new mongoose.Types.ObjectId(),
            question: "Test Reminder Doubt",
            sessionDuration: 30,
            status: "scheduled",
            sessionType: "scheduled",
            scheduledTime: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
        });

        // Clear redis key for session ID
        await redis.del(`reminder:5m:${session5m._id}`);

        emailsSent = [];
        console.log("Running cron to check scheduled sessions (should trigger 5-minute reminder)...");
        await checkScheduledSessions();

        const redisKey5m = await redis.get(`reminder:5m:${session5m._id}`);
        console.log("Redis key reminderSent5m value:", redisKey5m);
        console.log("Emails sent count:", emailsSent.length);

        if (redisKey5m !== "true") {
            throw new Error("Expected Redis key reminder:5m to be true");
        }
        if (emailsSent.length !== 2) {
            throw new Error(`Expected 2 emails (student & mentor), got ${emailsSent.length}`);
        }
        if (!emailsSent[0].subject.includes("Starts in 5 Minutes")) {
            throw new Error("Wrong email subject for 5-minute reminder");
        }

        // Running again should not send duplicates
        emailsSent = [];
        console.log("Running cron again (should not trigger duplicate 5-minute reminder)...");
        await checkScheduledSessions();
        console.log("Emails sent on 2nd run:", emailsSent.length);
        if (emailsSent.length !== 0) {
            throw new Error("Duplicate 5-minute reminders were sent!");
        }

        console.log("🎉 ALL PRE-MEETING REMINDER TESTS PASSED SUCCESSFULLY! ✅");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    } finally {
        await CommonUser.deleteMany({ email: /test_reminder_.*@test.com/ });
        await DoubtSession.deleteMany({ question: "Test Reminder Doubt" });
        await mongoose.connection.close();
        process.exit(0);
    }
}

testPreMeetingReminders();
