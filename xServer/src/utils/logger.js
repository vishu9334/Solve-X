import winston from 'winston'

// Define log levels and corresponding colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Bind colors to Winston
winston.addColors(colors);

// Custom log format for development console
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

// Standard JSON format for production files
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Determine active transport formats based on node environment
const loggerFormat = process.env.NODE_ENV === "production" ? prodFormat : devFormat;

const transports = [
  // Output to standard console
  new winston.transports.Console({
    format: loggerFormat,
  }),
  // Output errors to a dedicated error log file
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: prodFormat,
  }),
  // Output all logs to a combined application log file
  new winston.transports.File({
    filename: "logs/combined.log",
    format: prodFormat,
  }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports,
});

export {logger}
