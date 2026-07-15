
import dailyRepository from "../../repositorys/implimentations/mongo.daily.repository.js";
import { ApiError } from "../../utils/ApiError.js";

class dailyService {

    createDailRoom = async (doubtId) => {
        const room = await dailyRepository.dailyDoubtFind(doubtId);
        if(!room) throw new ApiError(400, "Session doubt not found");

        const roomName = `solvex-doubt-${doubtId}-${Date.now()}`;
        return {
            name: roomName,
            url: `https://meet.jit.si/${roomName}`
        };
    }
    deleteDailyRoom = async (roomName) => {
        // Jitsi rooms are ephemeral and self-cleaning, no API delete call needed
        return true;
    }
}

export default new dailyService()