import cron from "node-cron";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { runLiveWebSync } from "./scrapers/index.js";

let server;
let cronTask;

async function start() {
  await connectDatabase();

  server = app.listen(env.PORT, () => {
    console.log(`[API] Server listening on http://localhost:${env.PORT}/api/v1`);
  });

  if (cron.validate(env.SYNC_CRON_SCHEDULE)) {
    cronTask = cron.schedule(env.SYNC_CRON_SCHEDULE, async () => {
      console.log("[Cron] Running scheduled live Bangladesh govt web sync...");
      try {
        await runLiveWebSync({ triggeredBy: "cron" });
      } catch (err) {
        console.error("[Cron] Scheduled sync failed:", err.message);
      }
    });
    console.log(`[Cron] Live sync scheduled (${env.SYNC_CRON_SCHEDULE})`);
  }
}

async function shutdown(signal) {
  console.log(`\n[API] Received ${signal}, shutting down gracefully...`);
  if (cronTask) cronTask.stop();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("[API] Fatal startup error:", err);
  process.exit(1);
});
