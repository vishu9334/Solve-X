import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import randomNumGenerator from './UrandomNumber.generator.js'
class TokenManager {
  constructor() {
    this.secretKey = config.JWT_SECRET_KEY;
    this.refreshKey = config.REFRESH_SECRET_KEY;
    this.accessTokenExpiry = config.JWT_SECRET_KEY_EXPR;
    this.refreshTokenExpiry = config.REFRESH_KEY_EXPR;
  }

  generateAccessToken(payload) {
    return jwt.sign({...payload, jti: randomNumGenerator()}, this.secretKey, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign({...payload, jti: randomNumGenerator()}, this.refreshKey, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.secretKey);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshKey);
  }

  getRefreshTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };
  }

  setRefreshTokenCookie(res, token) {
    res.cookie("refreshToken", token, {
      ...this.getRefreshTokenCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

   clearRefreshTokenCookie(res) {
    res.clearCookie("refreshToken", this.getRefreshTokenCookieOptions());
  }

  setAccessTokenHeader(res, token) {
    res.setHeader("Authorization", `Bearer ${token}`);
  }
  clearAccessTokenHeader(res) {
    res.removeHeader("Authorization");
  }

}

export default new TokenManager();