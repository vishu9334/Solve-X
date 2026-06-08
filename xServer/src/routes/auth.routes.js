import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sendOtpValidator, verifyOtpValidator, registerValidator, loginValidator } from "../validators/auth.validator.js";

const router = Router();

router.post("/otpsend", validate(sendOtpValidator), AuthController.sendOtp);
router.post("/verify-register-otp", validate(verifyOtpValidator), AuthController.verifyRegisterOtp);
router.post("/register", validate(registerValidator), AuthController.register);
router.post("/login", validate(loginValidator), AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);

export default router;
