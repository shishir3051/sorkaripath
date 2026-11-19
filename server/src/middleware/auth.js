import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, toSafeUser } from "../models/User.js";
import {
  ensureConfiguredAdmins,
  isConfiguredAdminEmail,
} from "../services/authBootstrapService.js";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role === "admin" ? "admin" : "user",
      tv: user.tokenVersion || 0,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || "7d" }
  );
}

function getCookieOptions(req, includeMaxAge = true) {
  const isHttps =
    Boolean(req?.secure) ||
    String(req?.get?.("x-forwarded-proto") || "")
      .split(",")[0]
      .trim()
      .toLowerCase() === "https";

  const opts = {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
  };
  if (includeMaxAge) {
    opts.maxAge = COOKIE_MAX_AGE_MS;
  }
  return opts;
}

export function setAuthCookie(res, req, token) {
  res.cookie(env.AUTH_COOKIE_NAME, token, getCookieOptions(req, true));
}

export function clearAuthCookie(res, req) {
  res.clearCookie(env.AUTH_COOKIE_NAME, getCookieOptions(req, false));
}

export function extractAuthToken(req) {
  const cookieToken = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }
  const authHeader = req.header("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  return "";
}

export async function resolveUserFromRequest(req) {
  if (req._authResolved) {
    return req.user || null;
  }
  req._authResolved = true;
  req.user = null;

  const token = extractAuthToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!payload?.sub) return null;

    await ensureConfiguredAdmins();
    const user = await User.findById(payload.sub);
    if (!user || !user.isEmailVerified) return null;
    if ((user.tokenVersion || 0) !== (payload.tv || 0)) return null;

    if (isConfiguredAdminEmail(user.email) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    req.user = toSafeUser(user);
    return req.user;
  } catch {
    return null;
  }
}

export async function attachOptionalUser(req, _res, next) {
  try {
    await resolveUserFromRequest(req);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Please sign in with your account to access study materials.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdminRole(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
      });
    }
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Administrator permissions are required for this action.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}
