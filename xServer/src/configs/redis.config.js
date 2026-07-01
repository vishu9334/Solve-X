import { Redis } from "ioredis";
import config from "./config.js";

const redis = new Redis(config.REDIS_URL || "redis://127.0.0.1:6379");

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;