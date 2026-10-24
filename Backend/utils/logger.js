import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const logDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "logs"
);
const logFile = path.join(logDirectory, "backend.log");

const redactSensitiveData = (value) =>
  value
    .replace(
      /(mongodb(?:\+srv)?:\/\/)[^/\s@]+@/gi,
      "$1[REDACTED]@"
    )
    .replace(/((?:password|passwd|pwd)\s*[=:]\s*)[^\s&]+/gi, "$1[REDACTED]");

const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactSensitiveData(error.message),
      ...(typeof error.code === "string" ? { code: error.code } : {}),
      ...(error.stack ? { stack: redactSensitiveData(error.stack) } : {}),
    };
  }

  return { message: redactSensitiveData(String(error)) };
};

const writeLog = (level, message, error) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: redactSensitiveData(message),
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  };
  const line = JSON.stringify(entry);

  fs.mkdirSync(logDirectory, { recursive: true });
  fs.appendFileSync(logFile, `${line}\n`, "utf8");
  console[level](line);
};

const logger = {
  info: (message) => writeLog("info", message),
  warn: (message) => writeLog("warn", message),
  error: (message, error) => writeLog("error", message, error),
};

export default logger;
