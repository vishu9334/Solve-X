import AuthRepository from "../repositorys/implimentations/mongo.Auth.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { hashingMethod, compaireMethod } from "../utils/Uhash.system.js";
import { f4R } from "../utils/UOTP.generator.js";
import redisWhereHouse from "../services/redis/SRedis.server.js";
import TokenManager from "../utils/UTokenManager.util.js";
import emailQueue from '../queue/email.queue.js';

class AuthService {
    async register({ name, email, password, role }) {
        if (!name || !email || !password) {
            throw new ApiError(400, "All fields are required.");
        }

        if (role === "admin") {
            const allowedAdmins = ["connect.solvex99@gmail.com", "vishalkumarptn32@gmail.com"];
            if (!allowedAdmins.includes(email.toLowerCase())) {
                throw new ApiError(403, "Access denied. This email is not authorized for admin registration.");
            }
        }

        const existedUser = await AuthRepository.findUserByEmail(email);
        if (existedUser) throw new ApiError(409, "User already exists.");

        await redisWhereHouse.enforceRegisterOtpRateLimit(email);

        const username = email.split("@")[0];

        const OTP = f4R();
        const hashOTP = await hashingMethod(OTP);
        const passwordHash = await hashingMethod(password);
        const ttlInSeconds = 10 * 60;

        const userData = {
            name,
            username,
            email,
            password: passwordHash,
            otp: hashOTP,
            role: role || "student",
        };

        await Promise.all([
            redisWhereHouse.redisHSetFn(email, userData, ttlInSeconds),
            emailQueue.add("send-otp", { email, otp: OTP }),
        ]);

        return { email, message: "OTP sent successfully." };
    }

    async verifyOTP(email, otp) {
        if (!email || !otp) {
            throw new ApiError(400, "Email and OTP are required.");
        }

        const data = await redisWhereHouse.verifyOtpAndCleanupUser(email, otp);

        const { name, email: storedEmail, username, password, role } = data;

        const createdUser = await AuthRepository.createUser({
            name,
            username,
            email: storedEmail,
            password,
            role: role || "student",
            isVerified: true,
        });

        // Automatically create MentorProfile if role is mentor
        let mentorProfile = null;
        if (createdUser.role === "mentor") {
            const { MentorProfile } = await import("../models/AmentorProfile.model.js");
            mentorProfile = await MentorProfile.create({
                userId: createdUser._id,
                isVerifiedMentor: false,
                verificationStatus: "pending"
            });
        }

        const accessToken = TokenManager.generateAccessToken({ userId: createdUser._id });
        const refreshToken = TokenManager.generateRefreshToken({ userId: createdUser._id });

        const userObj = createdUser.toObject ? createdUser.toObject() : createdUser;
        delete userObj.password;

        // Attach mentor profile info if mentor
        if (mentorProfile) {
            userObj.mentorProfile = {
                isVerifiedMentor: mentorProfile.isVerifiedMentor,
                verificationStatus: mentorProfile.verificationStatus,
            };
        }

        return { accessToken, refreshToken, userObj };
    }

    async login({ email, password }) {
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const user = await AuthRepository.findUserByEmail(email);
        if (!user) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (!user.isVerified) {
            throw new ApiError(403, "Account not verified. Please complete registration.");
        }

        const isPasswordValid = await compaireMethod(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const accessToken = TokenManager.generateAccessToken({ userId: user._id });
        const refreshToken = TokenManager.generateRefreshToken({ userId: user._id });

        const userObj = user.toObject ? user.toObject() : user;
        delete userObj.password;

        return { accessToken, refreshToken, userObj };
    }

    async logout(accessToken, refreshToken) {
        if (!accessToken) {
            throw new ApiError(400, "Access token required.");
        }
       return await redisWhereHouse.blacklistTokens(accessToken, refreshToken);
    }

    async forgotPassword({ email }) {
        if (!email) {
            throw new ApiError(400, "Email is required.");
        }

        const user = await AuthRepository.findUserByEmail(email);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        if (!user.isVerified) {
            throw new ApiError(403, "Account not verified.");
        }

        await redisWhereHouse.enforcePasswordResetRateLimit(email);

        const OTP = f4R();
        const hashOTP = await hashingMethod(OTP);
        const ttlInSeconds = 10 * 60;

        await Promise.all([
            redisWhereHouse.storePasswordResetOtp(email, { email, otp: hashOTP }, ttlInSeconds),
            emailQueue.add("send-otp", { email, otp: OTP }),
        ]);

        return { email, message: "Password reset OTP sent successfully." };
    }

    async resetPassword({ email, otp, password }) {
        if (!email || !otp || !password) {
            throw new ApiError(400, "Email, OTP, and new password are required.");
        }

        await redisWhereHouse.verifyResetOtpAndCleanup(email, otp);

        const passwordHash = await hashingMethod(password);
        const updatedUser = await AuthRepository.updatePasswordByEmail(email, passwordHash);

        if (!updatedUser) {
            throw new ApiError(404, "User not found.");
        }

        return { email, message: "Password reset successfully." };
    }

    async regenerateToken({ refreshToken }) {
        if (!refreshToken) {
            throw new ApiError(401, "Refresh token is not valid or provided.");
        }

        let decoded;
        try {
            decoded = TokenManager.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new ApiError(401, "Refresh token is expired or invalid.");
        }

        const userId = decoded?.userId;;
        if (!userId) {
            throw new ApiError(401, "Invalid refresh token payload.");
        }

        const accessToken = TokenManager.generateAccessToken({ userId });
        return { accessToken };
    }

    async getCurrentUser(userId) {
        if (!userId) {
            throw new ApiError(400, "User ID is required.");
        }

        const user = await AuthRepository.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        let mentorProfile = null;
        if (user.role === "mentor") {
            const { MentorProfile } = await import("../models/AmentorProfile.model.js");
            mentorProfile = await MentorProfile.findOne({ userId: user._id });
        }

        const userObj = user.toObject ? user.toObject() : user;
        delete userObj.password;

        if (mentorProfile) {
            userObj.mentorProfile = {
                isVerifiedMentor: mentorProfile.isVerifiedMentor,
                verificationStatus: mentorProfile.verificationStatus,
            };
        }

        return { userObj };
    }

    async resendOtp(email) {
        if (!email) {
            throw new ApiError(400, "Email required for OTP resend.");
        }

        const exists = await redisWhereHouse.userExists(email);
        if (!exists) {
            throw new ApiError(400, "Registration data not found or expired. Please register again.");
        }

        const limitInfo = await redisWhereHouse.enforceResendRateLimit(email);

        const newOTP = f4R();
        const hashOTP = await hashingMethod(newOTP);

        await redisWhereHouse.updateUserOTP(email, hashOTP, 600);

        await emailQueue.add("send-otp", { email, otp: newOTP });

        return {
            email,
            attemptsRemaining: limitInfo.attemptsRemaining,
            message: "OTP resent successfully."
        };
    }
}

export default new AuthService();
