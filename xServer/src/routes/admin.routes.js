import { Router } from "express";
import { getAdminProfile, updateAdminProfile } from "../controllers/admin.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/admin/profile", verifyAccessToken, getAdminProfile);
router.patch("/admin/profile", verifyAccessToken, updateAdminProfile);

export default router;
