import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import dailyController from "../controllers/daily.controller.js";

const router = Router();

// Daily video room connection (legacy/Daily.co integration)
router.post("/daily/connect/:doubtId", verifyAccessToken, dailyController.dailyToConnect);

export default router;
