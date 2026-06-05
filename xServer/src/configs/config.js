import dotenv from 'dotenv';
dotenv.config()
export default {
    MONGODB_URI   : process.env.MONGODB_URI,
    REDIS_URL     : process.env.REDIS_URL,
    MISTRAL_MODEL : process.env.MISTRAL_MODEL,
    AI_API_KEY    : process.env.AI_API_KEY,
    PORT          : process.env.PORT,
    ADMIN_EMAIL   : process.env.ADMIN_EMAIL,
    ROLE_MENTOR   : process.env.ROLE_MENTOR,
    ROLE_ADMIN    : process.env.ROLE_ADMIN
};