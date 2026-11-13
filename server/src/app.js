import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

const configuredOrigins = env.CORS_ORIGIN.split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const privateLanPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const cleanVercelPrefix = env.CORS_VERCEL_PROJECT_PREFIX.trim().replace(
  /[^a-zA-Z0-9-]/g,
  ""
);
const vercelPreviewPattern = cleanVercelPrefix
  ? new RegExp(`^https:\\/\\/${cleanVercelPrefix}(?:-[a-z0-9-]+)*\\.vercel\\.app$`, "i")
  : /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        configuredOrigins.includes("*") ||
        configuredOrigins.includes(cleanOrigin)
      ) {
        return callback(null, true);
      }
      if (
        env.CORS_ALLOW_VERCEL_PREVIEWS === "true" &&
        vercelPreviewPattern.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      if (env.NODE_ENV !== "production" && privateLanPattern.test(cleanOrigin)) {
        return callback(null, true);
      }
      const err = new Error(`CORS blocked for origin: ${origin}`);
      err.statusCode = 403;
      return callback(err);
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "256kb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "sorkaripath-api",
    health: "/api/v1/health",
  });
});

app.use("/api/v1", async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
