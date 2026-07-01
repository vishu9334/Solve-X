import IMentorRepository from "../contracts/IMentor.contract.js";
import { MentorProfile } from "../../models/AmentorProfile.model.js";
import { Specialization } from "../../models/specialization.model.js";
import { Attempt } from "../../models/assessmentAttempt.model.js";
import { AssessmentStore } from "../../models/assessmentDataStore.model.js";
import { CommonUser } from "../../models/AbaseUser.model.js";
import mongoose from "mongoose";

class MongoMentorRepository extends IMentorRepository {
    async findMentorProfile(userId) {
        return MentorProfile.findOne({ userId });
    }

    async updateMentorSkill(userId, specializedId) {
        return MentorProfile.findOneAndUpdate(
            { userId },
            { specializedCategory: specializedId },
            { new: true }
        );
    }

    async findSpecializedById(specializedId) {
        return Specialization.findOne({ _id: specializedId, isActive: true });
    }

    // Case-insensitive name and slug search to prevent duplicates
    async findSpecializedByName(name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return Specialization.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name.trim()}$`, "i") } },
                { slug }
            ]
        });
    }

    // Create new skill + its AssessmentStore in one go
    async createSpecializedWithAssessment({ name, createdBy, source = "mentor" }) {
        // 1. Generate ObjectIds first to prevent Mongoose validation constraints from failing
        const assessmentId = new mongoose.Types.ObjectId();
        const specializedId = new mongoose.Types.ObjectId();

        // 2. Create AssessmentStore with valid skillId as category
        const assessment = await AssessmentStore.create({
            _id: assessmentId,
            createdBy,
            title: `${name} Assessment`,
            category: specializedId,
            durationMinutes: 0, // AI will calculate dynamically
            totalQuestions: 0,
            passingPercentage: 60,
        });

        // 3. Create Skill
        const specialization = new Specialization({
            _id: specializedId,
            name,
            createdBy,
            source,
            assessmentId: assessment._id,
            mentorCount: 0,
        });
        await specialization.save();

        return specialization;
    }

    async incrementMentorCount(specializedId) {
        return Specialization.findByIdAndUpdate(
            specializedId,
            { $inc: { mentorCount: 1 } },
            { new: true }
        );
    }

    // Decrement count, auto-delete mentor-created skills if count hits 0
    async decrementAndCleanup(specializedId) {
        const specialization = await Specialization.findByIdAndUpdate(
            specializedId,
            { $inc: { mentorCount: -1 } },
            { new: true }
        );

        if (specialization && specialization.mentorCount <= 0 && specialization.source === "mentor") {
            // Auto-delete: mentor-created specialization with 0 mentors
            if (specialization.assessmentId) {
                await AssessmentStore.findByIdAndDelete(specialization.assessmentId);
            }
            await Specialization.findByIdAndDelete(specialization._id);
            return null; // specialization deleted
        }

        return specialization;
    }

    async createAttempt(userId, assessmentId) {
        return Attempt.create({
            userId,
            assessmentId,
            status: "pending",
        });
    }

    async createAttemptWithMax(userId, assessmentId, maxAttempts) {
        return Attempt.create({
            userId,
            assessmentId,
            status: "pending",
            maxAttempts,
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
                    specializedCategory: "$result.specializedCategory",
                    verifiedAt: "$result.verifiedAt",
                    socialLinks: "$result.socialLinks",
                    jobTitle: "$result.jobTitle",
                    company: "$result.company",
                    experienceYears: "$result.experienceYears",
                    education: "$result.education",
                    certifications: "$result.certifications",
                    rating: "$result.rating",
                    ratingCount: "$result.ratingCount",
                    timezone: "$result.timezone",
                    preferredLanguage: "$result.preferredLanguage",
                    payoutDetails: "$result.payoutDetails"
                }
            },
            {
                $lookup: {
                    from: "specializations",
                    localField: "specializedCategory",
                    foreignField: "_id",
                    as: "specializedCategoryData"
                }
            },
            {
                $set: {
                    specializedCategoryData: { $first: "$specializedCategoryData" }
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
                    socialLinks: 1,
                    jobTitle: 1,
                    company: 1,
                    experienceYears: 1,
                    education: 1,
                    certifications: 1,
                    rating: 1,
                    ratingCount: 1,
                    timezone: 1,
                    preferredLanguage: 1,
                    payoutDetails: 1,
                    specialization: {
                        $cond: [
                            { $ifNull: ["$specializedCategoryData", false] },
                            {
                                name: "$specializedCategoryData.name",
                                description: "$specializedCategoryData.description",
                                isActive: "$specializedCategoryData.isActive",
                                mentorCount: "$specializedCategoryData.mentorCount"
                            },
                            null
                        ]
                    },
                    skill: {
                        $cond: [
                            { $ifNull: ["$specializedCategoryData", false] },
                            {
                                name: "$specializedCategoryData.name",
                                description: "$specializedCategoryData.description",
                                isActive: "$specializedCategoryData.isActive",
                                mentorCount: "$specializedCategoryData.mentorCount"
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
                    specializedCategory: "$profileDoc.specializedCategory",
                    isVerifiedMentor: "$profileDoc.isVerifiedMentor",
                    verificationStatus: "$profileDoc.verificationStatus",
                    rejectionReason: "$profileDoc.rejectionReason",
                    verifiedAt: "$profileDoc.verifiedAt",
                    rejectedAt: "$profileDoc.rejectedAt",
                    cooldownUntil: "$profileDoc.cooldownUntil",
                    socialLinks: "$profileDoc.socialLinks",
                    jobTitle: "$profileDoc.jobTitle",
                    company: "$profileDoc.company",
                    experienceYears: "$profileDoc.experienceYears",
                    education: "$profileDoc.education",
                    certifications: "$profileDoc.certifications",
                    rating: "$profileDoc.rating",
                    ratingCount: "$profileDoc.ratingCount",
                    timezone: "$profileDoc.timezone",
                    preferredLanguage: "$profileDoc.preferredLanguage",
                    payoutDetails: "$profileDoc.payoutDetails"
                }
            },
            {
                $lookup: {
                    from: "specializations",
                    localField: "specializedCategory",
                    foreignField: "_id",
                    as: "specializedCategoryData"
                }
            },
            {
                $set: {
                    specializedCategoryData: { $first: "$specializedCategoryData" }
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
                                        { $in: ["$status", ["completed", "scheduled"]] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
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
                    let: { specializedId: "$specializedCategory", mentorId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$specializedId", "$$specializedId"] },
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
                        socialLinks: { $ifNull: ["$socialLinks", []] },
                        jobTitle: { $ifNull: ["$jobTitle", ""] },
                        company: { $ifNull: ["$company", ""] },
                        experienceYears: { $ifNull: ["$experienceYears", 0] },
                        education: { $ifNull: ["$education", ""] },
                        certifications: { $ifNull: ["$certifications", []] },
                        rating: { $ifNull: ["$rating", 5.0] },
                        ratingCount: { $ifNull: ["$ratingCount", 0] },
                        timezone: { $ifNull: ["$timezone", ""] },
                        preferredLanguage: { $ifNull: ["$preferredLanguage", ""] },
                        payoutDetails: {
                            upiId: { $ifNull: ["$payoutDetails.upiId", ""] },
                            bankName: { $ifNull: ["$payoutDetails.bankName", ""] },
                            accountNumber: { $ifNull: ["$payoutDetails.accountNumber", ""] },
                            ifscCode: { $ifNull: ["$payoutDetails.ifscCode", ""] }
                        },
                        specialization: {
                            $cond: [
                                { $ifNull: ["$specializedCategoryData", false] },
                                {
                                    name: "$specializedCategoryData.name",
                                    slug: "$specializedCategoryData.slug"
                                },
                                null
                            ]
                        },
                        skill: {
                            $cond: [
                                { $ifNull: ["$specializedCategoryData", false] },
                                {
                                    name: "$specializedCategoryData.name",
                                    slug: "$specializedCategoryData.slug",
                                    description: "$specializedCategoryData.description"
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
                    activeSession: "$activeSession",
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

    async updateMentorProfile(userId, updateData) {
        return await MentorProfile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true }
        );
    }

    async updateMentorDescription(userId, description) {
        const mentorProfile = await MentorProfile.findOne({ userId });
        if (!mentorProfile?.specializedCategory) return null;
        return Specialization.findByIdAndUpdate(
            mentorProfile.specializedCategory,
            { description },
            { new: true }
        );
    }

    async findAttemptWithAssessment(attemptId, userId) {
        const { Attempt } = await import("../../models/assessmentAttempt.model.js");
        return await Attempt.findOne({ _id: attemptId, userId }).populate("assessmentId");
    }

    async findUserById(userId) {
        return await CommonUser.findById(userId);
    }

    async findAttemptByAssessment(userId, assessmentId) {
        const { Attempt } = await import("../../models/assessmentAttempt.model.js");
        return await Attempt.findOne({ userId, assessmentId });
    }

    async findAssessmentStoreById(assessmentId) {
        const { AssessmentStore } = await import("../../models/assessmentDataStore.model.js");
        return await AssessmentStore.findById(assessmentId);
    }

    async updateAssessmentStore(assessmentId, updateData) {
        const { AssessmentStore } = await import("../../models/assessmentDataStore.model.js");
        return await AssessmentStore.findByIdAndUpdate(assessmentId, updateData, { new: true });
    }

    async findLatestActivitySession(userId, assessmentId) {
        const { AssessmentActivitySession } = await import("../../models/assessmentActivityDataStore.model.js");
        return await AssessmentActivitySession.findOne({ userId, assessmentId }).sort({ createdAt: -1 });
    }

    async saveAnswers(attemptId, answersToInsert) {
        const { Answer } = await import("../../models/Answer.model.js");
        await Answer.deleteMany({ attemptId });
        return await Answer.insertMany(answersToInsert);
    }

    async saveAttempt(attempt) {
        return await attempt.save();
    }

    async findSpecializedByAssessmentId(assessmentId) {
        return await Specialization.findOne({ assessmentId });
    }

    async saveMentorProfile(mentorProfile) {
        return await mentorProfile.save();
    }

    async findActiveSessionForMentor(userId) {
        const { DoubtSession } = await import("../../models/doubtSession.model.js");
        return await DoubtSession.findOne({ selectedMentorId: userId, status: "in_session" });
    }

    async findOpenDoubtSession(doubtSessionId) {
        const { DoubtSession } = await import("../../models/doubtSession.model.js");
        return await DoubtSession.findOne({
            _id: doubtSessionId,
            $or: [
                { status: "open" },
                { status: "scheduled", selectedMentorId: null }
            ]
        });
    }

    async saveDoubtSession(doubtSession) {
        return await doubtSession.save();
    }

    async countActiveBids(userId) {
        const { DoubtSession } = await import("../../models/doubtSession.model.js");
        return await DoubtSession.countDocuments({
            $or: [
                { status: "open" },
                { status: "scheduled", selectedMentorId: null }
            ],
            "mentorOffers.mentorId": userId
        });
    }
    async specializationOfRepository(specializationId, specializationName) {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");
        return await SpecializationCatalog.findOne({
            $or: [
                { "specializationCatalogs.name": specializationName },
                { "specializationCatalogs.specializationIds": specializationId }
            ]
        })
    }
    async specializationOfRepositoryUpdate(specializationId, specializationName) {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");
        return SpecializationCatalog.updateOne(
            { "specializationCatalogs.name": specializationName },
            {
                $addToSet: {
                    "specializationCatalogs.$.specializationIds": specializationId
                }
            }
        );

    }
    async specializationOfNewCreateOne({ specializationName, specializationId }) {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");

        const result = await SpecializationCatalog.updateOne(
            {},
            {
                $push: {
                    specializationCatalogs: {
                        name: specializationName,
                        specializationIds: [specializationId],
                    },
                },
            },
            { upsert: true }
        );

        return result;
    }

    async createAssessmentForSpecialization(specializedId, createdBy, name) {
        const assessmentId = new mongoose.Types.ObjectId();
        const assessment = await AssessmentStore.create({
            _id: assessmentId,
            createdBy,
            title: `${name} Assessment`,
            category: specializedId,
            durationMinutes: 0,
            totalQuestions: 0,
            passingPercentage: 60,
        });

        await Specialization.findByIdAndUpdate(
            specializedId,
            { assessmentId: assessment._id }
        );
        return assessment;
    }

    async getAllSpecializationsAndCatalogs() {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");
        const specializations = await Specialization.find({ isActive: true }).select("name _id assessmentId");
        const catalogDoc = await SpecializationCatalog.findOne({});
        return {
            specializations,
            catalogs: catalogDoc ? catalogDoc.specializationCatalogs : []
        };
    }

    async findCatalogByName(name) {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");
        const catalogDoc = await SpecializationCatalog.findOne({
            "specializationCatalogs.name": { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });
        if (!catalogDoc) return null;
        return catalogDoc.specializationCatalogs.find(
            cat => cat.name.toLowerCase() === name.trim().toLowerCase()
        );
    }
}

const mentorRepository = new MongoMentorRepository();
export default mentorRepository;