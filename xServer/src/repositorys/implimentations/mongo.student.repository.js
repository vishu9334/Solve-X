import mongoose from 'mongoose'
import IstudentContract from '../contracts/IStudent.contract.js'
import { CommonUser } from '../../models/AbaseUser.model.js'
import { Specialization } from '../../models/specialization.model.js'
import { MentorProfile } from '../../models/AmentorProfile.model.js'
import { DoubtSession } from '../../models/doubtSession.model.js'
import { StudentProfile } from '../../models/AstudentProfile.model.js'

class MongoStudentRepository extends IstudentContract {
    findStudentId = async (userId) => {
        return await CommonUser.findById(userId);
    }

    findSpecializationIdentifier = async (specializationIdentifier) => {
        return await Specialization.findOne({ _id: specializationIdentifier, isActive: true });
    }

    findMentorBySpecialization = async (id) => {
        return await MentorProfile.find({
            specializedCategory: id,
            isVerifiedMentor: true
        }).populate("userId", "name email avatar");
    }

    createDoubtSession = async (data) => {
        return await DoubtSession.create(data);
    }

    updateDoubtSession = async (sessionId, updateData) => {
        return await DoubtSession.findByIdAndUpdate(sessionId, updateData, { new: true });
    }

    studentDashboard = async (userId) => {
        const result = await CommonUser.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
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
                    username: 1
                }
            },
            {
                $lookup: {
                    from: "studentprofiles",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$userId", "$$userId"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                userId: 0,
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0
                            }
                        }
                    ],
                    as: "profile"
                }
            },
            {
                $set: {
                    profile: {
                        $ifNull: [
                            { $first: "$profile" },
                            {
                                bio: null,
                                socialLinks: [],
                                skills: [],
                                education: "",
                                preferredLanguage: "",
                                timezone: "",
                                subscriptionStatus: "inactive",
                                subscriptionExpiresAt: null
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { studentId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$studentId", "$$studentId"] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSessions: { $sum: 1 },
                                completedSessions: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$status", "completed"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                activeSessions: {
                                    $sum: {
                                        $cond: [
                                            { $in: ["$status", ["open", "mentor_selected", "in_session"]] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                mentorSelectedSessions: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$status", "mentor_selected"] },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                expiredSessions: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$status", "expired"] },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: { _id: 0 }
                        }
                    ],
                    as: "sessionStats"
                }
            },
            {
                $set: {
                    stats: {
                        $ifNull: [
                            { $first: "$sessionStats" },
                            {
                                totalSessions: 0,
                                completedSessions: 0,
                                activeSessions: 0,
                                mentorSelectedSessions: 0,
                                expiredSessions: 0
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "doubtsessions",
                    let: { studentId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$studentId", "$$studentId"] }
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $skip: 0
                        },
                        {
                            $limit: 11
                        },
                        {
                            $lookup: {
                                from: "specializations",
                                localField: "specializedId",
                                foreignField: "_id",
                                as: "skill"
                            }
                        },
                        {
                            $lookup: {
                                from: "commonusers",
                                localField: "selectedMentorId",
                                foreignField: "_id",
                                as: "mentor"
                            }
                        },
                        {
                            $set: {
                                skill: { $first: "$skill" },
                                mentor: { $first: "$mentor" },
                                selectedOffer: {
                                    $first: {
                                        $filter: {
                                            input: { $ifNull: ["$mentorOffers", []] },
                                            as: "offer",
                                            cond: { $eq: ["$$offer.mentorId", "$selectedMentorId"] }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                question: 1,
                                status: 1,
                                questionAskedAt: "$createdAt",
                                durationMinutes: "$sessionDuration",
                                skill: {
                                    name: "$skill.name",
                                    slug: "$skill.slug"
                                },
                                mentor: {
                                    $cond: [
                                        { $ifNull: ["$mentor", false] },
                                        {
                                            name: "$mentor.name",
                                            username: "$mentor.username",
                                            avatar: "$mentor.avatar"
                                        },
                                        null
                                    ]
                                },
                                offer: {
                                    $cond: [
                                        { $ifNull: ["$selectedOffer", false] },
                                        {
                                            price: "$selectedOffer.price",
                                            availableTime: "$selectedOffer.availableTime",
                                            offeredAt: "$selectedOffer.offeredAt"
                                        },
                                        null
                                    ]
                                }
                            }
                        }
                    ],
                    as: "recentSessions"
                }
            },
            {
                $set: {
                    hasMore: {
                        $gt: [
                            { $size: { $ifNull: ["$recentSessions", []] } },
                            10
                        ]
                    },
                    recentSessions: {
                        $slice: [
                            { $ifNull: ["$recentSessions", []] },
                            10
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    user: {
                        name: "$name",
                        email: "$email",
                        isVerified: "$isVerified",
                        avatar: "$avatar",
                        role: "$role",
                        username: "$username"
                    },
                    profile: {
                        bio: "$profile.bio",
                        socialLinks: "$profile.socialLinks",
                        skills: "$profile.skills",
                        education: "$profile.education",
                        preferredLanguage: "$profile.preferredLanguage",
                        timezone: "$profile.timezone",
                        subscriptionStatus: "$profile.subscriptionStatus",
                        subscriptionExpiresAt: "$profile.subscriptionExpiresAt"
                    },
                    stats: 1,
                    recentSessions: 1,
                    pagination: {
                        page: { $literal: 1 },
                        limit: { $literal: 10 },
                        hasMore: "$hasMore"
                    }
                }
            }
        ]);

        return result[0] || null;
    }

    updateStudentBio = async (userId, bio) => {
        return await StudentProfile.findOneAndUpdate(
            { userId },
            { $set: { bio } },
            { new: true, upsert: true }
        );
    }

    updateStudentProfileFields = async (userId, updateData) => {
        return await StudentProfile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true }
        );
    }

    updateStudentName = async (userId, name) => {
        return await CommonUser.findByIdAndUpdate(
            userId,
            { $set: { name } },
            { new: true }
        );
    }

    findStudentProfile = async (userId) => {
        return await StudentProfile.findOne({ userId });
    }

    createStudentProfile = async (userId, data = {}) => {
        return await StudentProfile.create({ userId, ...data });
    }

    findActiveSessionForStudent = async (studentId) => {
        return await DoubtSession.findOne({
            studentId,
            status: { $in: ["open", "mentor_selected", "in_session"] }
        });
    }

    findActiveSessionForStudentPopulated = async (studentId) => {
        return await DoubtSession.findOne({
            studentId,
            status: { $in: ["open", "mentor_selected", "in_session"] }
        }).populate("selectedMentorId", "name email avatar");
    }

    findDoubtSessionById = async (sessionId) => {
        return await DoubtSession.findById(sessionId);
    }

    saveDoubtSession = async (session) => {
        return await session.save();
    }

    findMentorProfileByUserId = async (userId) => {
        return await MentorProfile.findOne({ userId });
    }

    findActiveSessionForMentor = async (mentorId) => {
        return await DoubtSession.findOne({
            selectedMentorId: mentorId,
            status: "in_session"
        });
    }

    findDoubtSessionByIdAndStudent = async (doubtSessionId, studentId) => {
        return await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId
        });
    }

    findDoubtSessionByIdAndStudentWithOffers = async (doubtSessionId, studentId) => {
        return await DoubtSession.findOne({
            _id: doubtSessionId,
            studentId
        }).populate("mentorOffers.mentorId", "name email avatar");
    }

    findDoubtSessionByIdAndStudentWithDetails = async (doubtSessionId, userId) => {
        return await DoubtSession.findOne({
            _id: doubtSessionId,
            $or: [
                { studentId: userId },
                { selectedMentorId: userId }
            ]
        })
        .populate("selectedMentorId", "name email avatar")
        .populate("studentId", "name email avatar")
        .populate("specializedId", "name slug");
    }


    countDoubtSessions = async (studentId, status) => {
        const query = { studentId };
        if (status) {
            if (Array.isArray(status)) {
                query.status = { $in: status };
            } else {
                query.status = status;
            }
        }
        return await DoubtSession.countDocuments(query);
    }

    findCompletedDoubtSessions = async (studentId) => {
        return await DoubtSession.find({ studentId, status: "completed" });
    }

    findRecentDoubtSessions = async (studentId, limit = 5) => {
        return await DoubtSession.find({ studentId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("selectedMentorId", "name email avatar");
    }

    getStudentProfileWithDetails = async (userId) => {
        const result = await CommonUser.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "studentprofiles",
                    localField: "_id",
                    foreignField: "userId",
                    as: "result"
                }
            },
            {
                $set: {
                    result: { 
                        $ifNull: [
                            { $arrayElemAt: ["$result", 0] },
                            {
                                bio: "",
                                socialLinks: [],
                                skills: [],
                                education: "",
                                preferredLanguage: "",
                                timezone: "",
                                subscriptionStatus: "inactive",
                                subscriptionExpiresAt: null
                            }
                        ]
                    }
                }
            },
            {
                $set: {
                    bio: "$result.bio",
                    socialLinks: "$result.socialLinks",
                    skills: "$result.skills",
                    education: "$result.education",
                    preferredLanguage: "$result.preferredLanguage",
                    timezone: "$result.timezone",
                    subscriptionStatus: "$result.subscriptionStatus",
                    subscriptionExpiresAt: "$result.subscriptionExpiresAt"
                }
            },
            {
                $unset: [
                    "password",
                    "result"
                ]
            }
        ]);

        return result[0] || null;
    }
    getListOfMentorForStudent = async (specializationName) => {
        const { default: SpecializationCatalog } = await import("../../models/specializationCatalogs.model.js");

        const pipeline = [
            // 1. Unwind the specializationCatalogs array into individual docs
            { $unwind: "$specializationCatalogs" },

            // 2. Unwind the specializationIds array to process each id separately
            { $unwind: "$specializationCatalogs.specializationIds" },

            // 3. Lookup Specialization model using specializationIds
            {
                $lookup: {
                    from: "specializations",
                    localField: "specializationCatalogs.specializationIds",
                    foreignField: "_id",
                    as: "specializationDoc"
                }
            },

            // 4. Unwind the looked-up specialization (filter out unmatched)
            { $unwind: { path: "$specializationDoc", preserveNullAndEmptyArrays: false } },

            // 5. Only include active specializations, and filter by specializationName if provided (matching category or specialization name)
            {
                $match: {
                    "specializationDoc.isActive": true,
                    ...(specializationName ? {
                        $or: [
                            {
                                "specializationCatalogs.name": {
                                    $regex: new RegExp(`^${specializationName}$`, "i")
                                }
                            },
                            {
                                "specializationDoc.name": {
                                    $regex: new RegExp(`^${specializationName}$`, "i")
                                }
                            }
                        ]
                    } : {})
                }
            },

            // 6. Lookup MentorProfile matching this specialization with isVerifiedMentor = true
            {
                $lookup: {
                    from: "mentorprofiles",
                    let: { specId: "$specializationDoc._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$specializedCategory", "$$specId"] },
                                        { $eq: ["$isVerifiedMentor", true] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "mentorProfiles"
                }
            },

            // 7. Skip specializations that have no verified mentors
            {
                $match: {
                    $expr: { $gt: [{ $size: "$mentorProfiles" }, 0] }
                }
            },

            // 8. Group back by category name
            {
                $group: {
                    _id: "$specializationCatalogs.name",
                    mentors: {
                        $push: {
                            specializationId: "$specializationDoc._id",
                            specializationName: "$specializationDoc.name",
                            specializationSlug: "$specializationDoc.slug",
                            description: "$specializationDoc.description",
                            mentorCount: { $size: "$mentorProfiles" }
                        }
                    }
                }
            },

            // 9. Shape final output
            {
                $project: {
                    _id: 0,
                    categoryName: "$_id",
                    mentors: 1
                }
            },

            // 10. Sort categories alphabetically
            { $sort: { categoryName: 1 } }
        ];

        return await SpecializationCatalog.aggregate(pipeline);
    }

    findMentorsWithProfileBySpecialization = async (specializationId) => {
        return await MentorProfile.find({
            specializedCategory: specializationId,
            isVerifiedMentor: true
        })
        .populate("userId", "name email avatar")
        .select("-payoutDetails -cooldownUntil -lastAssessmentAttemptId");
    }

}

const studentRepository = new MongoStudentRepository()
export default studentRepository