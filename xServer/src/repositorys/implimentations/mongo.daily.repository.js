import { DoubtSession } from "../../models/doubtSession.model.js";

class dailyRepository{
    async dailyDoubtFind(doubtId){
      return await DoubtSession.findById(doubtId);
    }
}
export default new dailyRepository;