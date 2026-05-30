const User          = require("./01_users");
const MentorProfile = require("./02_mentor_profile");
const StudentProfile= require("./03_student_profile");
const SkillCategory = require("./04_skill_categories");
const Session       = require("./05_sessions");
const DoubtRequest  = require("./06_doubt_requests");
const Notification  = require("./07_notifications");
const Feedback      = require("./08_feedback");
const Payment       = require("./09_payments");
const Leaderboard   = require("./10_leaderboard");
const AuditLog      = require("./11_audit_logs");

module.exports = {
  User,
  MentorProfile,
  StudentProfile,
  SkillCategory,
  Session,
  DoubtRequest,
  Notification,
  Feedback,
  Payment,
  Leaderboard,
  AuditLog,
};
