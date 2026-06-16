import { ApiError } from '../utils/ApiError.js';
import TokenManager from '../utils/UTokenManager.util.js';
import redisWhereHouse from '../services/redis/SRedis.server.js';

const getAccessTokenFromRequest = (req) => {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers?.authorization;
    const rawToken = cookieToken || authHeader;

    if (!rawToken || typeof rawToken !== 'string') return null;

    const trimmedToken = rawToken.trim();
    const bearerMatch = trimmedToken.match(/^Bearer\s+(.+)$/i);

    return (bearerMatch ? bearerMatch[1] : trimmedToken).trim();
};

const isJwtFormat = (token) => {
    if (!token) return false;
    if (['undefined', 'null'].includes(token.toLowerCase())) return false;
    if (token.includes('{{') || token.includes('}}')) return false;

    return token.split('.').length === 3;
};

export const verifyAccessToken = async (req, res, next) => {
    try {
        const token = getAccessTokenFromRequest(req);

        if (!token) throw new ApiError(401, "Access token missing.");
        if (!isJwtFormat(token)) {
            throw new ApiError(401, "Invalid access token. Send the JWT as: Authorization: Bearer <accessToken>.");
        }

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
        if (error.statusCode) {
            return next(error);
        }

        const message = error.name === 'TokenExpiredError'
            ? 'Access token expired. Please login again.'
            : 'Invalid access token. Please login again.';

        next(new ApiError(401, message));
    }
};
