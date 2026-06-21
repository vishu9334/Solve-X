import IMentorRepository from "../contracts/IMentor.contract.js";
import { MentorProfile } from "../../models/AmentorProfile.model.js";
import { Skill } from "../../models/skill.model.js";
import { Attempt } from "../../models/assessmentAttempt.model.js";
import { AssessmentStore } from "../../models/assessmentDataStore.model.js";
import { CommonUser } from "../../models/AbaseUser.model.js";
import mongoose from "mongoose";

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

    // Case-insensitive name and slug search to prevent duplicates
    async findSkillByName(name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return Skill.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name.trim()}$`, "i") } },
                { slug }
            ]
        });
    }

    // Create new skill + its AssessmentStore in one go
    async createSkillWithAssessment({ name, createdBy, source = "mentor" }) {
        // 1. Generate ObjectIds first to prevent Mongoose validation constraints from failing
        const assessmentId = new mongoose.Types.ObjectId();
        const skillId = new mongoose.Types.ObjectId();

        // 2. Create AssessmentStore with valid skillId as category
        const assessment = await AssessmentStore.create({
            _id: assessmentId,
            createdBy,
            title: `${name} Assessment`,
            category: skillId,
            durationMinutes: 0, // AI will calculate dynamically
            totalQuestions: 0,
            passingPercentage: 60,
        });

        // 3. Create Skill
        const skill = new Skill({
            _id: skillId,
            name,
            createdBy,
            source,
            assessmentId: assessment._id,
            mentorCount: 0,
        });
        await skill.save();

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

    async mentorProfileFetch(userId) {
        const result = await CommonUser.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "mentorprofiles",
                    localField: "_id",
                    foreignField: "userId",
                    as: "result"
                }
            },
            {
                $set: {
                    result: { $first: "$result" }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    isVerified: 1,
                    avatar: 1,
                    role: 1,
                    username: 1,
                    isVerifiedMentor: "$result.isVerifiedMentor",
                    verificationStatus: "$result.verificationStatus",
                    skillCategory: "$result.skillCategory",
                    verifiedAt: "$result.verifiedAt"
                }
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "skillCategory",
                    foreignField: "_id",
                    as: "skillCategoryData"
                }
            },
            {
                $set: {
                    skillCategoryData: { $first: "$skillCategoryData" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    email: 1,
                    isVerified: 1,
                    avatar: 1,
                    role: 1,
                    username: 1,
                    isVerifiedMentor: 1,
                    verificationStatus: 1,
                    skill: {
                        $cond: [
                            { $ifNull: ["$skillCategoryData", false] },
                            {
                                name: "$skillCategoryData.name",
                                description: "$skillCategoryData.description",
                                isActive: "$skillCategoryData.isActive",
                                mentorCount: "$skillCategoryData.mentorCount"
                            },
                            null
                        ]
                    }
                }
            }
        ]);

        return result[0] || null;
    }

    async mentorDashboardFetch(userId) {
        const result = await CommonUser.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "mentorprofiles",
                    localField: "_id",
                    foreignField: "userId",
                    as: "profileDoc"
                }
            },
            {
                $set: {
                    profileDoc: { $first: "$profileDoc" }
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    avatar: 1,
                    isVerified: 1,
                    role: 1,
                    username: 1,
                    skillCategory: "$profileDoc.skillCategory",
                    isVerifiedMentor: "$profileDoc.isVerifiedMentor",
                    verificationStatus: "$profileDoc.verificationStatus",
                    rejectionReason: "$profileDoc.rejectionReason",
                    verifiedAt: "$profileDoc.verifiedAt"
                }
            },
            {
                $lookup: {
                    from: "skills",
                    localField: "skillCategory",
                    foreignField: "_id",
                    as: "skillCategoryData"
                }
            },
            {
                $set: {
                    skillCategoryData: { $first: "$skillCategoryData" }
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { mentorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$selectedMentorId", "$$mentorId"] },
                                        { $eq: ["$status", "completed"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                myOffer: {
                                    $first: {
                                        $filter: {
                                            input: { $ifNull: ["$mentorOffers", []] },
                                            as: "offer",
                                            cond: { $eq: ["$$offer.mentorId", "$$mentorId"] }
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    as: "completedSessions"
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { mentorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$selectedMentorId", "$$mentorId"] },
                                        { $eq: ["$status", "in_session"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 },
                        {
                            $lookup: {
                                from: "commonusers",
                                localField: "studentId",
                                foreignField: "_id",
                                as: "studentInfo"
                            }
                        },
                        {
                            $set: {
                                studentId: { $first: "$studentInfo" }
                            }
                        },
                        {
                            $project: {
                                studentInfo: 0
                            }
                        }
                    ],
                    as: "activeSessionArray"
                }
            },
            {
                $set: {
                    activeSession: {
                        $cond: [
                            { $gt: [{ $size: "$activeSessionArray" }, 0] },
                            { $first: "$activeSessionArray" },
                            null
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { mentorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$selectedMentorId", "$$mentorId"] },
                                        { $eq: ["$status", "completed"] }
                                    ]
                                }
                            }
                        },
                        { $sort: { sessionEndedAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "commonusers",
                                localField: "studentId",
                                foreignField: "_id",
                                as: "studentInfo"
                            }
                        },
                        {
                            $set: {
                                studentId: { $first: "$studentInfo" }
                            }
                        },
                        {
                            $project: {
                                studentInfo: 0
                            }
                        }
                    ],
                    as: "recentSessions"
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { skillId: "$skillCategory", mentorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$skillId", "$$skillId"] },
                                        { $eq: ["$status", "open"] },
                                        { $not: { $in: ["$$mentorId", { $ifNull: ["$mentorOffers.mentorId", []] }] } }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        {
                            $lookup: {
                                from: "commonusers",
                                localField: "studentId",
                                foreignField: "_id",
                                as: "studentInfo"
                            }
                        },
                        {
                            $set: {
                                studentId: { $first: "$studentInfo" }
                            }
                        },
                        {
                            $project: {
                                studentInfo: 0
                            }
                        }
                    ],
                    as: "opportunities"
                }
            },
            {
                $project: {
                    _id: 0,
                    profile: {
                        name: "$name",
                        email: "$email",
                        avatar: "$avatar",
                        isVerifiedMentor: { $ifNull: ["$isVerifiedMentor", false] },
                        verificationStatus: { $ifNull: ["$verificationStatus", "pending"] },
                        skill: {
                            $cond: [
                                { $ifNull: ["$skillCategoryData", false] },
                                {
                                    name: "$skillCategoryData.name",
                                    slug: "$skillCategoryData.slug"
                                },
                                null
                            ]
                        },
                        rejectionReason: "$rejectionReason"
                    },
                    stats: {
                        $cond: [
                            { $eq: ["$isVerifiedMentor", true] },
                            {
                                totalResolved: { $size: "$completedSessions" },
                                totalEarnings: { $sum: "$completedSessions.myOffer.price" },
                                hasActiveSession: { $gt: [{ $size: "$activeSessionArray" }, 0] }
                            },
                            null
                        ]
                    },
                    activeSession: {
                        $cond: [
                            { $eq: ["$isVerifiedMentor", true] },
                            "$activeSession",
                            null
                        ]
                    },
                    recentSessions: {
                        $cond: [
                            { $eq: ["$isVerifiedMentor", true] },
                            "$recentSessions",
                            []
                        ]
                    },
                    opportunities: {
                        $cond: [
                            { $eq: ["$isVerifiedMentor", true] },
                            "$opportunities",
                            []
                        ]
                    }
                }
            }
        ]);

        return result[0] || null;
    }

    async updateMentorDescription(userId, description) {
        const mentorProfile = await MentorProfile.findOne({ userId });
        if (!mentorProfile?.skillCategory) return null;
        return Skill.findByIdAndUpdate(
            mentorProfile.skillCategory,
            { description },
            { new: true }
        );
    }
}

const mentorRepository = new MongoMentorRepository();
export default mentorRepository;