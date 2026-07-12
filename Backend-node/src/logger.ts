import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.colorize({ all: true }),
    format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level}]: ${stack ?? message}`;
    }),
  ),
  transports: [new transports.Console()],
});

export default logger;
