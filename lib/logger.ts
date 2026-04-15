/**
 * Minimal structured logger.
 * In production, replace with a proper logging service (e.g., Axiom, Datadog).
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

function log(level: LogLevel, message: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "production") {
    // In production: output JSON for log aggregators
    console[level](JSON.stringify(entry));
  } else {
    // In development: human-readable output
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    const logFn =
      level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    if (data !== undefined) {
      logFn(prefix, message, data);
    } else {
      logFn(prefix, message);
    }
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
