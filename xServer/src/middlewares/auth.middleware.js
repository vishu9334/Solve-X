import { ApiError } from '../utils/ApiError.js';
import TokenManager from '../utils/UTokenManager.util.js';
import redisWhereHouse from '../services/redis/SRedis.server.js';

export const verifyAccessToken = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken 
            || req.headers?.authorization;

        // Strip "Bearer " prefix if present
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        
        // Trim whitespace
        token = token?.trim();

        if (!token) throw new ApiError(401, "Access token missing.");

        // 1. JWT verify
        const decoded = TokenManager.verifyAccessToken(token);

        // 2. Blacklist check
        const isBlacklisted = await redisWhereHouse.isTokenBlacklisted(token, 'access');
        if (isBlacklisted) throw new ApiError(401, "Token has been invalidated. Please login again.");

        req.user = decoded.payload || decoded;
        req.user.userId = req.user.userId || decoded.userId;
        req.user._id = req.user.userId || req.user._id;
        req.accessToken = token;
        next();
    } catch (error) {
        next(new ApiError(error.statusCode || 401, error.message));
    }
};