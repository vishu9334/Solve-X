// Load environment variables as early as possible
import dotenv from 'dotenv'
dotenv.config()

import {app} from './src/app.js'
import {logger} from './src/utils/logger.js';
import mongoose from 'mongoose';
import config from './src/configs/config.js';

import http from 'http';
import {initSocket} from './src/helpers/socket/socket.helper.js'

const PORT = process.env.PORT || 8000;

// Connect to MongoDB and start Express Server
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info(`Connected to MongoDB successfully at ${config.MONGODB_URI}`);
    import("./src/workers/email.worker.js");
    logger.info("Email worker started successfully");
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => {
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
  // Wait for connections, server might be undefined if not started yet
  process.exit(1);
});
})
.catch((err) => {
  logger.error(`Failed to connect to MongoDB: ${err.message}`);
  process.exit(1);
});
