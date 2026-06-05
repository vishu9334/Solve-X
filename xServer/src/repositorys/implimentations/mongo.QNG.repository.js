import iQNGrepository from "../contracts/IQNG.contract.js";
import { CommonUser } from "../../models/AbaseUser.model.js";
import { Attempt } from "../../models/assessmentAttempt.model.js";

class MongoQNGRepository extends iQNGrepository {
  async findQNGRepository(userData) {
    const { userId, attemptId, skill } = userData;

    const [user, attempt] = await Promise.all([
      CommonUser.findById(userId),
        Attempt.findOne({
        _id: attemptId,
        userId: userId,
      }),
    ]);

    return {
      user,
      attempt,
      skill,
    };
  }
}

 const questionRepository = new MongoQNGRepository();
 export default questionRepository