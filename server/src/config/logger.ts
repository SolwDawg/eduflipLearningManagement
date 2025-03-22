import winston from "winston";

// Define logger configuration
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  handleExceptions: true,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize(),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
});

// Create Winston logger instance
const logger = winston.createLogger({
  transports: [consoleTransport],
  exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by 'morgan'
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
