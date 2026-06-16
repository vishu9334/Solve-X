import { Router } from "express";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard/student", verifyAccessToken, dashboardController.getStudentDashboard);
router.get("/dashboard/mentor",  verifyAccessToken, dashboardController.getMentorDashboard);
router.get("/dashboard/admin",   verifyAccessToken, dashboardController.getAdminDashboard);

export default router;
