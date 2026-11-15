/**
 * Re-runs classifyRecord() over already-synced JobCircular documents.
 *
 * classifyRecord() only runs at ingest, so a change to its rules leaves older
 * rows on their previous recordType until the source happens to re-publish.
 * This backfills them.
 *
 *   npm --prefix server run reclassify -- --dry-run
 *   npm --prefix server run reclassify
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { JobCircular } from "../models/JobCircular.js";
import { classifyRecord } from "../scrapers/utils.js";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`[reclassify] connected (${mongoose.connection.name})`);

  // Curated rows are hand-written, not scraper output - leave them alone.
  const docs = await JobCircular.find({ origin: "web_sync" })
    .select("_id title category recordType")
    .lean();
  console.log(`[reclassify] examining ${docs.length} web_sync records`);

  const ops = [];
  const moves = new Map();
  for (const doc of docs) {
    // Mirrors npfTableAdapter: title + defaultCategory, no extra hint.
    const { recordType } = classifyRecord(
      doc.title || "",
      doc.category || "General Notice"
    );
    if (recordType === doc.recordType) continue;
    const key = `${doc.recordType || "(unset)"} -> ${recordType}`;
    moves.set(key, (moves.get(key) || 0) + 1);
    ops.push({
      updateOne: { filter: { _id: doc._id }, update: { $set: { recordType } } },
    });
  }

  if (!ops.length) {
    console.log("[reclassify] nothing to change");
  } else {
    console.log(`[reclassify] ${ops.length} record(s) would change:`);
    for (const [key, count] of [...moves].sort((a, b) => b[1] - a[1])) {
      console.log(`             ${key}  x${count}`);
    }
    if (dryRun) {
      console.log("[reclassify] --dry-run: no writes performed");
    } else {
      const res = await JobCircular.bulkWrite(ops, { ordered: false });
      console.log(`[reclassify] updated ${res.modifiedCount} record(s)`);
    }
  }

  const summary = await JobCircular.aggregate([
    { $group: { _id: "$recordType", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log("[reclassify] recordType totals now:");
  summary.forEach((r) => console.log(`             ${String(r._id).padEnd(15)}${r.n}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[reclassify] failed:", err.message);
  process.exit(1);
});
