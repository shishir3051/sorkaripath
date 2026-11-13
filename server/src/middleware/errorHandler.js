import { env } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource identifier format",
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate record already exists",
    });
  }

  const statusCode = err?.statusCode || 500;
  const exposeMessage =
    statusCode < 500 || env.NODE_ENV !== "production"
      ? err?.message || "Internal server error"
      : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message: exposeMessage,
  });
}
