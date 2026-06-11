import dotenv from 'dotenv';
dotenv.config()
export default {
    MONGODB_URI         : process.env.MONGODB_URI,
    REDIS_URL           : process.env.REDIS_URL,
    MISTRAL_MODEL       : process.env.MISTRAL_MODEL,
    AI_API_KEY          : process.env.AI_API_KEY,
    BREVO_FROM_EMAIL    : process.env.BREVO_FROM_EMAIL,
    BREVO_API_KEY       : process.env.BREVO_API_KEY,
    PORT                : process.env.PORT,
    ADMIN_EMAIL         : process.env.ADMIN_EMAIL,
    SMTP_KEY            : process.env.SMTP_KEY,
    ROLE_MENTOR         : process.env.ROLE_MENTOR,
    ROLE_ADMIN          : process.env.ROLE_ADMIN,
    APP_PASSWORD        : process.env.APP_PASSWORD,
    APP_EMAIL           : process.env.APP_EMAIL,
    JWT_SECRET_KEY      : process.env.JWT_SECRET_KEY,
    JWT_SECRET_KEY_EXPR : process.env.JWT_SECRET_KEY_EXPR,
    REFRESH_SECRET_KEY  : process.env.REFRESH_SECRET_KEY,
    REFRESH_KEY_EXPR    : process.env.REFRESH_KEY_EXPR,
    SALT                : process.env.SALT,
    EXPIRE_IN           : process.env.REDIS_EXPIRE_IN
};