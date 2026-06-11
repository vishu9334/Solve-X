import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import AuthService from "../services/AuthService.js";
import TokenManager from "../utils/UTokenManager.util.js";


// class AuthController {
//   sendOtp = asyncHandler(async (req, res) => {
//     const { email } = req.body;

//     const data = await AuthService.sendOtp(email);

//     return res.status(201).json(
//       new ApiResponse(201, data, "OTP sent successfully")
//     );
//   });

//   verifyRegisterOtp = asyncHandler(async (req, res) => {
//     const { email, otp } = req.body;
//     const stringOtp = String(otp);

//     const data = await AuthService.verifyRegisterOtp({ email, otp: stringOtp });

//     return res.status(200).json(
//       new ApiResponse(200, data, "Account verified successfully")
//     );
//   });

//   register = asyncHandler(async (req, res) => {
//     const data = await AuthService.register(req.body);

//     res.cookie("accessToken", data.accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 15 * 60 * 1000
//     });

//     res.cookie("refreshToken", data.refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     return res.status(201).json(
//       new ApiResponse(201, { user: data.user }, "User registered successfully")
//     );
//   });

//   login = asyncHandler(async (req, res) => {
//     const data = await AuthService.login(req.body);

//     res.cookie("accessToken", data.accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 15 * 60 * 1000
//     });

//     res.cookie("refreshToken", data.refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     return res.status(200).json(
//       new ApiResponse(200, { user: data.user }, "Login successful")
//     );
//   });

//   refreshToken = asyncHandler(async (req, res) => {
//     const rToken = req.cookies?.refreshToken;
//     const data = await AuthService.refreshAccessToken(rToken);

//     res.cookie("accessToken", data.accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 15 * 60 * 1000
//     });

//     return res.status(200).json(
//       new ApiResponse(200, { authenticated: true }, "Access token refreshed successfully")
//     );
//   });
// }

// export default new AuthController();


class AuthController {
    register = asyncHandler(async(req, res)=>{
      const {name, email, password, role} = req.body;
     const reponse = await AuthService.register({name,email,password,role})
     res.status(200).json(new ApiResponse(200,reponse, {message:"OTP send on your email."}))
    })

    verifyOTP = asyncHandler(async(req, res)=>{
      const {email, otp} = req.body;
      const {accessToken,refreshToken,userObj} = await AuthService.verifyOTP(email, otp);
     res.setHeader('Authorization', `Bearer ${accessToken}`);

     res.cookie("refreshToken", refreshToken, {
      httpOnly:true,
      secure:true,
      sameSite:'strict',
      maxAge : 7 * 24 * 60 * 60 * 1000 
     })
     return res.status(200).json(new ApiResponse(200, {accessToken,refreshToken,userObj}, {message:"User register successful"}));
    })

    login = asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      TokenManager.clearRefreshTokenCookie(res);
      TokenManager.clearAccessTokenHeader(res);

      const { accessToken, refreshToken, userObj } = await AuthService.login({ email, password });

      TokenManager.setAccessTokenHeader(res, accessToken);
      TokenManager.setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken, userObj }, { message: "Login successful" })
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
}

export default new  AuthController()