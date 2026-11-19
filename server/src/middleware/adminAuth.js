import { env } from "../config/env.js";
import { safeSecretEqual } from "../utils/security.js";
import { resolveUserFromRequest } from "./auth.js";

export async function requireAdminKey(req, res, next) {
  try {
    const providedKey = req.header("x-admin-key") || "";
    if (safeSecretEqual(providedKey, env.ADMIN_API_KEY)) {
      return next();
    }

    const user = await resolveUserFromRequest(req);
    if (user?.role === "admin") {
      return next();
    }

    return res.status(401).json({
      success: false,
      message:
        "Unauthorized: admin session or valid x-admin-key header is required.",
    });
  } catch (err) {
    next(err);
  }
}
