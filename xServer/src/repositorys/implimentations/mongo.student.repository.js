import mongoose from 'mongoose'
import IstudentContract from '../contracts/IStudent.contract.js'
import { CommonUser } from '../../models/AbaseUser.model.js'
import { Skill } from '../../models/skill.model.js'
import { MentorProfile } from '../../models/AmentorProfile.model.js'
import { DoubtSession } from '../../models/doubtSession.model.js'
import { StudentProfile } from '../../models/AstudentProfile.model.js'

class MongoStudentRepository extends IstudentContract {
    findStudentId = async (userId) => {
        return await CommonUser.findById(userId);
    }

    findSkillandSlug = async (skillIdentifier) => {
        return await Skill.findOne({ _id: skillIdentifier, isActive: true });
    }

    findMentorBySkill = async (id) => {
        return await MentorProfile.find({
            skillCategory: id,
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
                                from: "skills",
                                localField: "skillId",
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

    updateStudentName = async (userId, name) => {
        return await CommonUser.findByIdAndUpdate(
            userId,
            { $set: { name } },
            { new: true }
        );
    }
}

const studentRepository = new MongoStudentRepository()
export default studentRepository