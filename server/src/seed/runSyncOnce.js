import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { runLiveWebSync } from "../scrapers/index.js";

async function main() {
  await connectDatabase();
  const result = await runLiveWebSync({ triggeredBy: "manual" });
  console.log("[Sync] Complete:", JSON.stringify(result, null, 2));
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error("[Sync] Failed:", err);
  await disconnectDatabase();
  process.exit(1);
});
