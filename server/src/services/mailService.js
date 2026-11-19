import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let cachedTransporter = null;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isMailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter() {
  if (!isMailConfigured()) {
    const err = new Error(
      "Email service is not configured on the server (SMTP_HOST/SMTP_USER/SMTP_PASS missing)."
    );
    err.statusCode = 503;
    throw err;
  }

  if (!cachedTransporter) {
    const secure =
      env.SMTP_SECURE === "true" || Number(env.SMTP_PORT) === 465;
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return cachedTransporter;
}

const PURPOSE_COPY = {
  verify_email: {
    subject: "Verify your Gmail / Email — SorkariPath Study Access",
    heading: "Verify your email address",
    intro:
      "Use the 6-digit verification code below to activate your account and unlock SorkariPath Study Hub, A-to-Z Academy, and MCQ Practice Arena.",
    expiryNote: "This verification code expires in 15 minutes.",
  },
  reset_password: {
    subject: "Password Reset Code — SorkariPath",
    heading: "Reset your password",
    intro:
      "We received a request to reset your SorkariPath password. Enter the 6-digit code below to choose a new password.",
    expiryNote: "This reset code expires in 15 minutes.",
  },
  login_otp: {
    subject: "Your Sign-In Code — SorkariPath",
    heading: "One-time sign-in code",
    intro:
      "Use this 6-digit one-time code to sign in to your SorkariPath account and access all locked study modules.",
    expiryNote: "This sign-in code expires in 10 minutes.",
  },
};

export async function sendOtpEmail({ to, name, otp, purpose }) {
  const copy = PURPOSE_COPY[purpose] || PURPOSE_COPY.verify_email;
  const safeName = escapeHtml(name || "Learner");
  const safeOtp = escapeHtml(otp);
  const fromAddress = env.MAIL_FROM || env.SMTP_USER;

  const text = [
    `Hello ${name || "Learner"},`,
    "",
    copy.intro,
    "",
    `Your 6-digit code: ${otp}`,
    "",
    copy.expiryNote,
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f6f8f7; padding:24px; color:#0f172a;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#064e3b,#047857); padding:20px 24px; color:#ffffff;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#a7f3d0;">SorkariPath Account Security</div>
          <h1 style="margin:6px 0 0; font-size:20px; font-weight:800;">${escapeHtml(copy.heading)}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 12px; font-size:15px;">Hello <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#334155;">${escapeHtml(copy.intro)}</p>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:16px; text-align:center; margin-bottom:20px;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#065f46; margin-bottom:6px;">6-Digit Verification Code</div>
            <div style="font-family:monospace; font-size:32px; font-weight:800; letter-spacing:0.22em; color:#064e3b;">${safeOtp}</div>
          </div>
          <p style="margin:0 0 8px; font-size:13px; color:#475569;">${escapeHtml(copy.expiryNote)}</p>
          <p style="margin:0; font-size:12px; color:#64748b;">Never share this code with anyone. If you did not initiate this request, you can safely ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: copy.subject,
    text,
    html,
  });

  return {
    delivered: true,
    messageId: info.messageId,
  };
}
