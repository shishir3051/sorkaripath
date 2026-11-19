import { Router } from "express";
import { z } from "zod";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  requestLoginOtp,
  resendOtp,
  resetPassword,
  verifyEmail,
  verifyLoginOtp,
} from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";

const emailField = z.string().trim().email("Enter a valid Gmail / email address").max(160);
const passwordField = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be 128 characters or fewer");
const otpField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit verification code");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  email: emailField,
  password: passwordField,
});

const verifyEmailSchema = z.object({
  email: emailField,
  otp: otpField,
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(128),
});

const loginOtpRequestSchema = z.object({
  email: emailField,
});

const loginOtpVerifySchema = z.object({
  email: emailField,
  otp: otpField,
});

const resendOtpSchema = z.object({
  email: emailField,
  purpose: z.enum(["verify_email", "reset_password", "login_otp"]),
});

const forgotPasswordSchema = z.object({
  email: emailField,
});

const resetPasswordSchema = z.object({
  email: emailField,
  otp: otpField,
  newPassword: passwordField,
});

const authLimiter = createRateLimiter({ windowMs: 60_000, max: 15 });
const otpLimiter = createRateLimiter({ windowMs: 60_000, max: 8 });

const router = Router();

router.get("/me", getMe);
router.post("/register", otpLimiter, validateBody(registerSchema), register);
router.post("/verify-email", authLimiter, validateBody(verifyEmailSchema), verifyEmail);
router.post("/resend-otp", otpLimiter, validateBody(resendOtpSchema), resendOtp);
router.post("/login", authLimiter, validateBody(loginSchema), login);
router.post(
  "/login-otp/request",
  otpLimiter,
  validateBody(loginOtpRequestSchema),
  requestLoginOtp
);
router.post(
  "/login-otp/verify",
  authLimiter,
  validateBody(loginOtpVerifySchema),
  verifyLoginOtp
);
router.post(
  "/forgot-password",
  otpLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  resetPassword
);
router.post("/logout", logout);

export default router;
