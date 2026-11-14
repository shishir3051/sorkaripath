import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const WEAK_ADMIN_DEFAULTS = new Set([
  "bd-govt-admin-2026",
  "change-me-in-production",
  "secret",
  "admin123",
]);

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(5050),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    CORS_ALLOW_VERCEL_PREVIEWS: z.enum(["true", "false"]).default("false"),
    CORS_VERCEL_PROJECT_PREFIX: z.string().optional().default(""),
    ADMIN_API_KEY: z.string().min(6).default("bd-govt-admin-2026"),
    CRON_SECRET: z.string().optional().default(""),
    PUBLIC_SYNC_COOLDOWN_SEC: z.coerce.number().int().min(30).max(3600).default(180),
    AUTO_SYNC_STALE_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
    SYNC_CRON_SCHEDULE: z.string().default("0 */6 * * *"),
    SCRAPER_TIMEOUT_MS: z.coerce.number().int().min(3000).max(30000).default(10000),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (
        WEAK_ADMIN_DEFAULTS.has(data.ADMIN_API_KEY) ||
        data.ADMIN_API_KEY.length < 16
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["ADMIN_API_KEY"],
          message:
            "Production ADMIN_API_KEY must be set to a unique random secret (>= 16 characters).",
        });
      }
      if (data.CRON_SECRET && data.CRON_SECRET.length < 16) {
        ctx.addIssue({
          code: "custom",
          path: ["CRON_SECRET"],
          message: "CRON_SECRET must be at least 16 characters when configured.",
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = z.flattenError(parsed.error).fieldErrors;
  console.error("Invalid environment configuration:", details);
  if (process.env.VERCEL) {
    throw new Error(`Invalid environment configuration: ${JSON.stringify(details)}`);
  }
  process.exit(1);
}

export const env = parsed.data;
