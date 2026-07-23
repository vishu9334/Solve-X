import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import AuthService from "../services/AuthService.js";
import TokenManager from "../utils/UTokenManager.util.js";
import { ApiError } from "../utils/ApiError.js";

class AuthController {
    register = asyncHandler(async(req, res)=>{
      const {name, email, password, role} = req.body;
     const reponse = await AuthService.register({name,email,password,role})
      return res.status(200).json(new ApiResponse(200,reponse, {message:"OTP send on your email."}))
    })

    verifyOTP = asyncHandler(async(req, res)=>{
      const {email, otp} = req.body;
      const {accessToken,refreshToken,userObj} = await AuthService.verifyOTP(email, otp);
      TokenManager.setAccessTokenHeader(res, accessToken);
      TokenManager.setRefreshTokenCookie(res, refreshToken);
      return res.status(200).json(new ApiResponse(200, { userObj, accessToken }, {message:"User register successful"}));
    })

    login = asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      const { accessToken, refreshToken, userObj } = await AuthService.login({ email, password });
       TokenManager.setAccessTokenHeader(res, accessToken);
       TokenManager.setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json(
        new ApiResponse(200, { userObj, accessToken }, { message: "Login successful" })
      );
    })

    logout = asyncHandler(async (req, res) => {
      const accessToken = req.accessToken;
      const refreshToken = req.cookies?.refreshToken;
      await AuthService.logout(accessToken, refreshToken);

      TokenManager.clearRefreshTokenCookie(res);
      TokenManager.clearAccessTokenHeader(res);

      return res.status(200).json(
          new ApiResponse(200, {}, { message: "Logged out successfully." })
      );
  })

    forgotPassword = asyncHandler(async (req, res) => {
      const { email } = req.body;
      const response = await AuthService.forgotPassword({ email });

      return res.status(200).json(
        new ApiResponse(200, response, { message: "Password reset OTP sent to your email." })
      );
    })

    resetPassword = asyncHandler(async (req, res) => {
      const { email, otp, password } = req.body;
      const response = await AuthService.resetPassword({ email, otp, password });

      return res.status(200).json(
        new ApiResponse(200, response, { message: "Password updated successfully." })
      );
    })

    reGenerateToken = asyncHandler(async(req, res)=>{
      const refreshToken= req.cookies?.refreshToken;
       if (!refreshToken) {
      throw new ApiError(401, "No active session found.");
    }
      const { accessToken } = await AuthService.regenerateToken({ refreshToken });

      TokenManager.setAccessTokenHeader(res, accessToken);

      return res.status(200).json(
        new ApiResponse(200, { accessToken }, { message: "Access token regenerated successfully." })
      );
    })

    getCurrentUser = asyncHandler(async (req, res) => {
      const userId = req.user.userId;
      const response = await AuthService.getCurrentUser(userId);
      return res.status(200).json(
        new ApiResponse(200, response, { message: "User profile fetched successfully." })
      );
    })

    resendOTP = asyncHandler(async(req, res)=>{
      const {email} = req.body;
      const response = await AuthService.resendOtp(email);
      return res.status(200).json(new ApiResponse(200, response, { message: "OTP resend successful" }));
    })
}

export default new  AuthController()