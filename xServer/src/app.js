import express from 'express'
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import {logger} from '../src/utils/logger.js'
import mentorRoutes from './routes/mentor.routes.js';
import activitySessionRoutes from './routes/activitySession.routes.js';
import authRoutes from './routes/auth.routes.js';
import specializationRoutes from './routes/specialization.routes.js';
import studentRoutes from './routes/student.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import dailyRoutes from './routes/daily.routes.js';
const app = express();

const morganMiddleware = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);

app.use(morganMiddleware);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  logger.debug("Health check endpoint hit");
  return res.status(200).json({
    status: "success",
    message: "Solve-X backend server is running smoothly",
    timestamp: new Date(),
  });
});


app.use("/api/v1", mentorRoutes, activitySessionRoutes, authRoutes, specializationRoutes, studentRoutes, dashboardRoutes, adminRoutes, dailyRoutes);

app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    logger.error(`${err.message} - Stack: ${err.stack}`);
  } else {
    logger.warn(`${err.message}`);
  }

  return res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors?.length ? err.errors : undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

export {app}
