import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { ApiError } from "../utils/ApiError.js";
import dailyService from "../services/daily/daily.service.js";
import { DoubtSession } from "../models/doubtSession.model.js";
import { sendNotificationToUser } from "../helpers/socket/socket.helper.js";

class dailyController {
    dailyToConnect = asyncHandler(async (req, res) => {
        const { doubtId } = req.params;
        
        const doubt = await DoubtSession.findById(doubtId);
        if (!doubt) {
            throw new ApiError(404, "Doubt session not found");
        }

        const response = await dailyService.createDailRoom(doubtId);

        // Save to DB so the room details persist
        doubt.videoRoomUrl = response.url;
        doubt.videoRoomName = response.name;
        await doubt.save();

        // Notify both student and mentor via socket
        await sendNotificationToUser(doubt.studentId, "session:started", {
            doubtId,
            videoRoomUrl: response.url,
        });

        if (doubt.selectedMentorId) {
            await sendNotificationToUser(doubt.selectedMentorId, "session:started", {
                doubtId,
                videoRoomUrl: response.url,
            });
        }

        return res.status(200).json(
            new ApiResponse(200, { videoRoomUrl: response.url }, "Daily room link generated successfully.")
        );
    });

    acceptDoubtRequest = asyncHandler(async (req, res) => {
        const { doubtId } = req.params;
        const mentorId = req.user?._id || req.user?.userId;

        const doubt = await DoubtSession.findById(doubtId);
        if (!doubt) {
            throw new ApiError(404, "Doubt session not found");
        }

        // Generate Daily video room details
        const room = await dailyService.createDailRoom(doubtId);

        // Update DoubtSession fields in DB
        doubt.status = "in_session";
        doubt.videoRoomUrl = room.url;       // student ko dikhane ke liye
        doubt.videoRoomName = room.name;     // delete ke liye save karo
        doubt.selectedMentorId = mentorId;
        await doubt.save();

        // Emit Socket notification to student that session has started
        await sendNotificationToUser(doubt.studentId, "session:started", {
            doubtId,
            videoRoomUrl: room.url,
        });

        // Emit Socket notification to mentor as well
        await sendNotificationToUser(mentorId, "session:started", {
            doubtId,
            videoRoomUrl: room.url,
        });

        return res.status(200).json(
            new ApiResponse(200, { videoRoomUrl: room.url }, "Doubt accepted successfully. Session started.")
        );
    });
}

export default new dailyController();