
import { ApiError } from '../../utils/ApiError.js';
import { compaireMethod } from '../../utils/Uhash.system.js';
import redis from '../../configs/redis.config.js'
import jwt from 'jsonwebtoken'

class redisWhereHouse {
  async redisHSetFn(email, userData, ttlInSeconds) {
    try {
      const key = `user:${email}`
      await redis.hset(key, ...Object.entries(userData).flat());
      await redis.expire(key, ttlInSeconds)
    } catch (error) {
      throw new ApiError(400, error.message || "Redis with have some problem.");
    }
  }
  async verifyOtpAndCleanupUser(email, userOtp) {
    try {
      const key = `user:${email}`;

      const userData = await redis.hgetall(key);
      console.log("userData from Redis:", userData);
      console.log("userOtp received:", userOtp, typeof userOtp);

      if (Object.keys(userData).length === 0) {
        throw new ApiError(400, "User data not found or OTP expired.");
      }

      const isOtpValid = await compaireMethod(userOtp, userData.otp);

      if (!isOtpValid) {
        throw new ApiError(400, "Invalid OTP.");
      }

      const { otp, ...cleanUserData } = userData;

      await redis.del(key);

      return cleanUserData;

    } catch (error) {
      throw new ApiError(
        error.statusCode || 400,
        error.message || "Error during OTP verification."
      );
    }
  }

  async blacklistTokens(accessToken, refreshToken) {
    try {
      const pipeline = redis.pipeline();
      let queued = 0;

      const queueToken = (token, type) => {
        if (!token) return;
        const decoded = jwt.decode(token);
        if (!decoded?.jti || !decoded?.exp) return;

        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0) return;

        pipeline.setex(`bl:${type}:${decoded.jti}`, ttl, '1');
        queued++;
      };

      queueToken(accessToken, 'access');
      queueToken(refreshToken, 'refresh');

      if (queued === 0) return;

      const results = await pipeline.exec();
      const failed = results?.find(([err]) => err);
      if (failed) throw failed[0];
    } catch (error) {
      throw new ApiError(500, error.message || "Token blacklisting failed.");
    }
  }

  async isTokenBlacklisted(token, type = 'access') {
    try {
      const decoded = jwt.decode(token);
      if (!decoded?.jti) return false;

      const result = await redis.get(`bl:${type}:${decoded.jti}`);
      return result !== null;
    } catch {
      return false;
    }
  }

  async storePasswordResetOtp(email, userData, ttlInSeconds) {
    try {
      const key = `reset:${email}`;
      await redis.hset(key, ...Object.entries(userData).flat());
      await redis.expire(key, ttlInSeconds);
    } catch (error) {
      throw new ApiError(400, error.message || "Redis with have some problem.");
    }
  }

  async verifyResetOtpAndCleanup(email, userOtp) {
    try {
      const key = `reset:${email}`;
      const userData = await redis.hgetall(key);

      if (Object.keys(userData).length === 0) {
        throw new ApiError(400, "Reset OTP not found or expired.");
      }

      const isOtpValid = await compaireMethod(userOtp, userData.otp);
      if (!isOtpValid) {
        throw new ApiError(400, "Invalid OTP.");
      }

      const { otp, ...cleanUserData } = userData;
      await redis.del(key);

      return cleanUserData;
    } catch (error) {
      throw new ApiError(
        error.statusCode || 400,
        error.message || "Error during reset OTP verification."
      );
    }
  }

  async enforcePasswordResetRateLimit(email, maxAttempts = 2, windowSeconds = 30 * 60) {
    try {
      const key = `reset:limit:${email}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > maxAttempts) {
        const ttl = await redis.ttl(key);
        const waitMinutes = Math.max(1, Math.ceil(ttl / 60));
        throw new ApiError(
          429,
          `Too many password reset attempts. Try again in ${waitMinutes} minutes.`
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(429, error.message || "Password reset rate limit exceeded.");
    }
  }

}
export default new redisWhereHouse
