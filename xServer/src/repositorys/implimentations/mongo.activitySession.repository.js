import IActivitySessionRepository from "../contracts/IActivitySession.contract.js";
import { AssessmentActivitySession } from "../../models/assessmentActivityDataStore.model.js";

class MongoActivitySessionRepository extends IActivitySessionRepository {
  async createSession(sessionData) {
    return AssessmentActivitySession.create(sessionData);
  }

  async findSessionById(sessionId) {
    return AssessmentActivitySession.findById(sessionId);
  }

  async findSessionByIdWithUser(sessionId) {
    return AssessmentActivitySession.findById(sessionId).populate("userId", "name email");
  }

  async findSessionsByUser(query) {
    return AssessmentActivitySession.find(query)
      .sort({ createdAt: -1 })
      .select("-events")
      .populate("userId", "name email");
  }

  async findSessionReportById(sessionId) {
    return AssessmentActivitySession.findById(sessionId)
      .populate("userId", "name email")
      .lean();
  }
  async findSessionByIdAndUser(sessionId, userId) {
    return AssessmentActivitySession.findOne({ 
        _id: sessionId, 
        userId  
    });
  }

  async saveSession(session) {
    return session.save();
  }
}

const activitySessionRepository = new MongoActivitySessionRepository();
export default activitySessionRepository;
