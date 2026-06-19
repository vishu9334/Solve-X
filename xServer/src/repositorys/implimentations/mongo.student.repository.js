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
                $lookup: {
                    from: 'studentprofiles',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'profile'
                }
            },
            {
                $lookup: {
                    from: 'doubtsessions',
                    localField: '_id',
                    foreignField: 'studentId',
                    as: 'sessions'
                }
            },
            {
                $lookup: {
                    from: 'skills',
                    localField: 'sessions.skillId',
                    foreignField: '_id',
                    as: 'skillDocs'
                }
            },
            {
                $lookup: {
                    from: 'commonusers',
                    localField: 'sessions.selectedMentorId',
                    foreignField: '_id',
                    as: 'mentorDocs'
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
                    profile: {
                        $let: {
                            vars: {
                                profileData: { $arrayElemAt: ['$profile', 0] }
                            },
                            in: {
                                bio: '$$profileData.bio',
                                subscriptionStatus: '$$profileData.subscriptionStatus',
                                subscriptionExpiresAt: '$$profileData.subscriptionExpiresAt'
                            }
                        }
                    },
                    stats: {
                        totalSessions: { $size: '$sessions' },
                        completedSessions: {
                            $size: {
                                $filter: {
                                    input: '$sessions',
                                    as: 'session',
                                    cond: { $eq: ['$$session.status', 'completed'] }
                                }
                            }
                        },
                        activeSessions: {
                            $size: {
                                $filter: {
                                    input: '$sessions',
                                    as: 'session',
                                    cond: { $ne: ['$$session.status', 'completed'] }
                                }
                            }
                        }
                    },
                    sessions: {
                        $map: {
                            input: '$sessions',
                            as: 'session',
                            in: {
                                question: { $ifNull: ['$$session.question', null] },
                                questionAskedAt: '$$session.createdAt',
                                status: '$$session.status',
                                durationMinutes: '$$session.sessionDuration',
                                skill: {
                                    $let: {
                                        vars: {
                                            skillData: {
                                                $first: {
                                                    $filter: {
                                                        input: '$skillDocs',
                                                        as: 'skill',
                                                        cond: { $eq: ['$$skill._id', '$$session.skillId'] }
                                                    }
                                                }
                                            }
                                        },
                                        in: '$$skillData.name'
                                    }
                                },
                                mentor: {
                                    $let: {
                                        vars: {
                                            mentorData: {
                                                $first: {
                                                    $filter: {
                                                        input: '$mentorDocs',
                                                        as: 'mentor',
                                                        cond: { $eq: ['$$mentor._id', '$$session.selectedMentorId'] }
                                                    }
                                                }
                                            }
                                        },
                                        in: {
                                            name: '$$mentorData.name',
                                            username: '$$mentorData.username',
                                            avatar: '$$mentorData.avatar'
                                        }
                                    }
                                },
                                offer: {
                                    $let: {
                                        vars: {
                                            offerData: {
                                                $first: {
                                                    $filter: {
                                                        input: '$$session.mentorOffers',
                                                        as: 'offer',
                                                        cond: { $eq: ['$$offer.mentorId', '$$session.selectedMentorId'] }
                                                    }
                                                }
                                            }
                                        },
                                        in: {
                                            price: '$$offerData.price',
                                            availableTime: '$$offerData.availableTime',
                                            offeredAt: '$$offerData.offeredAt'
                                        }
                                    }
                                }
                            }
                        }
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