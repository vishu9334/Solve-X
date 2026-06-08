import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import AuthService from "../services/AuthService.js";

class AuthController {
  sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const data = await AuthService.sendOtp(email);

    return res.status(201).json(
      new ApiResponse(201, data, "OTP sent successfully")
    );
  });

  verifyRegisterOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const stringOtp = String(otp);

    const data = await AuthService.verifyRegisterOtp({ email, otp: stringOtp });

    return res.status(200).json(
      new ApiResponse(200, data, "Account verified successfully")
    );
  });

  register = asyncHandler(async (req, res) => {
    const data = await AuthService.register(req.body);

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json(
      new ApiResponse(201, { user: data.user }, "User registered successfully")
    );
  });

  login = asyncHandler(async (req, res) => {
    const data = await AuthService.login(req.body);

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(
      new ApiResponse(200, { user: data.user }, "Login successful")
    );
  });

  refreshToken = asyncHandler(async (req, res) => {
    const rToken = req.cookies?.refreshToken;
    const data = await AuthService.refreshAccessToken(rToken);

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 15 * 60 * 1000
    });

    return res.status(200).json(
      new ApiResponse(200, { authenticated: true }, "Access token refreshed successfully")
    );
  });
}

export default new AuthController();
