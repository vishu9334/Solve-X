import express from 'express'
import cors from 'cors'
import morgan from 'morgan';
import {logger} from '../src/utils/logger.js'

const app = express();

// ─── Morgan Logger Middleware Integration ────────────────────────────────────
// Define a custom morgan stream that pipes HTTP logs into our Winston logger
const morganMiddleware = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);

// Apply custom request logging
app.use(morganMiddleware);

// ─── Standard Express Middlewares ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Basic Health Check Endpoint ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  logger.debug("Health check endpoint hit");
  return res.status(200).json({
    status: "success",
    message: "Solve-X backend server is running smoothly",
    timestamp: new Date(),
  });
});

// ─── 404 Route Handler ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 404;
  next(err);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  // Log critical errors with stack trace, otherwise info level
  if (statusCode >= 500) {
    logger.error(`${err.message} - Stack: ${err.stack}`);
  } else {
    logger.warn(`${err.message}`);
  }

  return res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

export {app}
