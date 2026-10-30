import logger from "../utils/logger.js";

export function errorResponse(error) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return { status: 400, body: { success: false, message: "Invalid JSON request body.", errors: [] } };
  }
  if (error.name === "ValidationError") {
    return { status: 400, body: { success: false, message: "Submitted data failed validation.", errors: [] } };
  }
  if (error.name === "CastError") {
    return { status: 400, body: { success: false, message: "Invalid resource identifier.", errors: [] } };
  }
  if (error.code === 11000) {
    return { status: 409, body: { success: false, message: "A record with that value already exists.", errors: [] } };
  }
  return { status: 500, body: { success: false, message: "An unexpected server error occurred.", errors: [] }, log: true };
}

export function apiErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const result = errorResponse(error);
  if (result.log) logger.error("API request failed", error);
  return res.status(result.status).json(result.body);
}
