import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import AuthRepository from "../repositorys/AuthRepository.js";
import MailService from "./MailService.js";
import { ApiError } from "../utils/ApiError.js";

class AuthService {
  async sendOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await AuthRepository.findUserByEmail(normalizedEmail);

    if (user && user.isVerified) {
      throw new ApiError(400, "User already registered. Please login.");
    }

    if (user && user.otp && user.otp.expiresAt > Date.now()) {
      const remainingTimeMs = user.otp.expiresAt - Date.now();
      const remainingSeconds = Math.ceil(remainingTimeMs / 1000);
      
      let formattedTime = "";
      if (remainingSeconds >= 60) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        formattedTime = `${minutes} minute${minutes > 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} seconds` : ''}`;
      } else {
        formattedTime = `${remainingSeconds} seconds`;
      }

      const error = new ApiError(429, "OTP already sent. Please wait before requesting another OTP.", [
        { remainingTime: remainingSeconds, formattedTime }
      ]);
      error.data = { remainingTime: remainingSeconds, formattedTime };
      throw error;
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);

    const hashedOtp = await bcrypt.hash(otpCode, 10);

    const upsertedUser = await AuthRepository.upsertOtpUser({
      email: normalizedEmail,
      otpCode: hashedOtp,
      otpExpiresAt,
    });

    try {
      await MailService.sendOtpEmail(normalizedEmail, otpCode);
    } catch (error) {
      if (upsertedUser && upsertedUser._id) {
        await AuthRepository.clearOtp(upsertedUser._id);
      }
      throw new ApiError(500, "Failed to send OTP email. Please try again.");
    }

    return {
      otpExpiresAt,
    };
  }

  async verifyRegisterOtp({ email, otp }) {
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await AuthRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new ApiError(400, "Invalid email or OTP");
    }

    if (user.isVerified) {
      throw new ApiError(400, "Account already verified.");
    }

    if (!user.otp || !user.otp.code) {
      throw new ApiError(400, "OTP not found. Please request a new OTP.");
    }

    if (user.otp.expiresAt < Date.now()) {
      throw new ApiError(400, "OTP has expired. Please request a new OTP.");
    }

    const isValidOtp = await bcrypt.compare(otp, user.otp.code);
    if (!isValidOtp) {
      throw new ApiError(400, "Invalid OTP");
    }

    await AuthRepository.verifyUser(user._id);

    const registrationToken = jwt.sign(
      { email: user.email },
      config.SECRET_TOKEN,
      { expiresIn: "10m" }
    );

    return {
      isVerified: true,
      registrationToken,
    };
  }

  async register({ registrationToken, name, password, role, avatar }) {
    if (!registrationToken) {
      throw new ApiError(401, "Unauthorized user");
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(registrationToken, config.SECRET_TOKEN);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired registration token");
    }

    const email = decodedUser.email;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Unauthorized user");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Email not verified");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateData = {
      name,
      password: hashedPassword,
    };
    if (role) updateData.role = role;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await AuthRepository.completeRegistration(user._id, updateData);

    const accessToken = jwt.sign(
      { userId: updatedUser._id, role: updatedUser.role },
      config.SECRET_TOKEN,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: updatedUser._id },
      config.SECRET_TOKEN,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
      accessToken,
      refreshToken
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await AuthRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email first.");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      config.SECRET_TOKEN,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.SECRET_TOKEN,
      { expiresIn: "7d" }
    );

    const userObj = user.toJSON();
    delete userObj.otp;

    return {
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        avatar: userObj.avatar
      },
      accessToken,
      refreshToken
    };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.SECRET_TOKEN);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, "Refresh token expired. Please login again.");
      }
      throw new ApiError(401, "Invalid refresh token");
    }

    const userId = decoded.userId;
    const user = await AuthRepository.findById(userId);

    if (!user) {
      throw new ApiError(401, "Unauthorized user");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email first.");
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      config.SECRET_TOKEN,
      { expiresIn: "15m" }
    );

    return {
      user: user.toJSON(),
      accessToken
    };
  }
}

export default new AuthService();
