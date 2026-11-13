import { env } from "../config/env.js";
import { safeSecretEqual } from "../utils/security.js";

export function requireAdminKey(req, res, next) {
  const providedKey = req.header("x-admin-key") || "";
  if (!safeSecretEqual(providedKey, env.ADMIN_API_KEY)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: valid x-admin-key header is required for admin mutations.",
    });
  }
  next();
}
