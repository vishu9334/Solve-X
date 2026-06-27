import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import dailyController from "../controllers/daily.controller.js";

const router = Router();

router.post("/daily/connect/:doubtId", verifyAccessToken, dailyController.dailyToConnect);
router.post("/mentor/accept-doubt/:doubtId", verifyAccessToken, dailyController.acceptDoubtRequest);

export default router;
