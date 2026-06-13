import IstudentContract from '../contracts/IStudent.contract.js'
import { CommonUser } from '../../models/AbaseUser.model.js'
import { Skill } from '../../models/skill.model.js'
import { MentorProfile } from '../../models/AmentorProfile.model.js'
import { DoubtSession } from '../../models/doubtSession.model.js'

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
}

const studentRepository = new MongoStudentRepository()
export default studentRepository