import type { NextConfig } from "next";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rawApiOrigin = process.env.EXPRESS_API_ORIGIN?.trim().replace(/\/+$/, "");
const apiOrigin =
  rawApiOrigin ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:5050" : "");

function getLocalDevOrigins(): string[] {
  if (process.env.VERCEL) return [];
  const origins = new Set<string>(["localhost", "127.0.0.1", "192.168.0.102"]);
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const iface of list || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        origins.add(iface.address);
      }
    }
  }
  if (process.env.ALLOWED_DEV_ORIGINS) {
    for (const o of process.env.ALLOWED_DEV_ORIGINS.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  allowedDevOrigins: getLocalDevOrigins(),
  turbopack: {
    root: configDir,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "0" },
        ],
      },
    ];
  },
  async rewrites() {
    if (!apiOrigin) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
