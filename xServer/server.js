// Load environment variables as early as possible
import dotenv from 'dotenv'
dotenv.config()

import {app} from './src/app.js'
import {logger} from './src/utils/logger.js';

const PORT = process.env.PORT || 8000;

// Start Express Server
const server = app.listen(PORT, () => {
  logger.info(`Solve-X server successfully started on port ${PORT}`);
  logger.info(`Health check active at http://localhost:${PORT}/health`);
  logger.info(`Active environment: ${process.env.NODE_ENV || "development"}`);
});

// ─── Unhandled Rejection & Uncaught Exception Handlers ───────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} - reason: ${reason}`);
  // Keep server running but alert administrators in real-time production
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception thrown: ${error.message} - Stack: ${error.stack}`);
  // Graceful shutdown to allow active connections to complete
  logger.warn("Server shutting down due to uncaught exception...");
  server.close(() => {
    process.exit(1);
  });
});
