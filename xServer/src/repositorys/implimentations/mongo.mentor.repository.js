import IMentorRepository from "../contracts/IMentor.contract.js";
import { MentorProfile } from "../../models/AmentorProfile.model.js";
import { Skill } from "../../models/skill.model.js";
import { Attempt } from "../../models/assessmentAttempt.model.js";
import { AssessmentStore } from "../../models/assessmentDataStore.model.js";

class MongoMentorRepository extends IMentorRepository {
    async findMentorProfile(userId) {
        return MentorProfile.findOne({ userId });
    }

    async updateMentorSkill(userId, skillId) {
        return MentorProfile.findOneAndUpdate(
            { userId },
            { skillCategory: skillId },
            { new: true }
        );
    }

    async findSkillById(skillId) {
        return Skill.findOne({ _id: skillId, isActive: true });
    }

    // Case-insensitive name search
    async findSkillByName(name) {
        return Skill.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    }

    // Create new skill + its AssessmentStore in one go
    async createSkillWithAssessment({ name, createdBy, source = "mentor" }) {
        // 1. Create AssessmentStore first (empty, AI will fill later)
        const assessment = await AssessmentStore.create({
            createdBy,
            title: `${name} Assessment`,
            category: null, // will update after skill creation
            durationMinutes: 0, // AI will calculate dynamically
            totalQuestions: 0,
            passingPercentage: 60,
        });

        // 2. Create Skill (pre-save hook will Title Case name + generate slug)
        const skill = new Skill({
            name,
            createdBy,
            source,
            assessmentId: assessment._id,
            mentorCount: 0,
        });
        await skill.save();

        // 3. Link AssessmentStore back to skill
        assessment.category = skill._id;
        await assessment.save();

        return skill;
    }

    async incrementMentorCount(skillId) {
        return Skill.findByIdAndUpdate(
            skillId,
            { $inc: { mentorCount: 1 } },
            { new: true }
        );
    }

    // Decrement count, auto-delete mentor-created skills if count hits 0
    async decrementAndCleanup(skillId) {
        const skill = await Skill.findByIdAndUpdate(
            skillId,
            { $inc: { mentorCount: -1 } },
            { new: true }
        );

        if (skill && skill.mentorCount <= 0 && skill.source === "mentor") {
            // Auto-delete: mentor-created skill with 0 mentors
            if (skill.assessmentId) {
                await AssessmentStore.findByIdAndDelete(skill.assessmentId);
            }
            await Skill.findByIdAndDelete(skill._id);
            return null; // skill deleted
        }

        return skill;
    }

    async createAttempt(userId, assessmentId) {
        return Attempt.create({
            userId,
            assessmentId,
            status: "pending",
        });
    }
}

const mentorRepository = new MongoMentorRepository();
export default mentorRepository;