import { Router } from "express";
import AuthController from "../controllers/Auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  verifyOtpValidator,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerValidator), AuthController.register);
router.post("/verify-otp", validate(verifyOtpValidator), AuthController.verifyOTP);
router.post("/login", validate(loginValidator), AuthController.login);
router.post("/forgot-password", validate(forgotPasswordValidator), AuthController.forgotPassword);
router.post("/reset-password", validate(resetPasswordValidator), AuthController.resetPassword);
router.post("/logout",     verifyAccessToken, AuthController.logout);

export default router;