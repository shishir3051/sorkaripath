/**
 * Collapses duplicate CurrentAffairsItem rows and rehashes the survivors.
 *
 * The RSS adapter used to hash on (source + title + link). BSS republishes one
 * story under several section paths (/subscriber/, /district/, /others/) with
 * different article ids, so each copy produced a different hash and was stored
 * again. The adapter now hashes on (source + title) only.
 *
 * That change invalidates every stored sourceHash, so this script must run once
 * after it: without a rehash the next sync would match nothing and re-insert
 * the whole feed. sourceHash is UNIQUE, so duplicates are deleted BEFORE the
 * survivors are rehashed, otherwise the collapse would violate the index.
 *
 *   npm --prefix server run dedupe:affairs -- --dry-run
 *   npm --prefix server run dedupe:affairs
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { CurrentAffairsItem } from "../models/CurrentAffairsItem.js";
import { createSourceHash } from "../scrapers/utils.js";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`[dedupe] connected (${mongoose.connection.name})`);

  const docs = await CurrentAffairsItem.find({})
    .select("_id title sourceKey sourceHash summary createdAt")
    .lean();
  console.log(`[dedupe] examining ${docs.length} current-affairs records`);

  // Group by the hash the fixed adapter will now produce.
  const groups = new Map();
  for (const doc of docs) {
    const hash = createSourceHash(doc.sourceKey, doc.title);
    if (!groups.has(hash)) groups.set(hash, []);
    groups.get(hash).push(doc);
  }

  const idsToDelete = [];
  const toRehash = [];
  const perSource = new Map();

  for (const [hash, rows] of groups) {
    // Keep the richest copy (longest summary), oldest row as the tie-break.
    const keep = rows.slice().sort(
      (a, b) =>
        String(b.summary || "").length - String(a.summary || "").length ||
        new Date(a.createdAt) - new Date(b.createdAt)
    )[0];

    for (const row of rows) {
      if (String(row._id) !== String(keep._id)) {
        idsToDelete.push(row._id);
        perSource.set(row.sourceKey, (perSource.get(row.sourceKey) || 0) + 1);
      }
    }
    if (keep.sourceHash !== hash) toRehash.push({ _id: keep._id, hash });
  }

  console.log(`[dedupe] duplicate rows to remove : ${idsToDelete.length}`);
  console.log(`[dedupe] survivors needing rehash : ${toRehash.length}`);
  if (perSource.size) {
    console.log("[dedupe] duplicates by source:");
    for (const [key, n] of [...perSource].sort((a, b) => b[1] - a[1])) {
      console.log(`           ${String(key).padEnd(26)}${n}`);
    }
  }

  if (dryRun) {
    console.log("[dedupe] --dry-run: no writes performed");
  } else {
    // Order matters: sourceHash is UNIQUE, so the losers must go before the
    // survivors take over the shared hash.
    if (idsToDelete.length) {
      const res = await CurrentAffairsItem.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`[dedupe] deleted ${res.deletedCount} duplicate row(s)`);
    }
    if (toRehash.length) {
      const ops = toRehash.map(({ _id, hash }) => ({
        updateOne: { filter: { _id }, update: { $set: { sourceHash: hash } } },
      }));
      const res = await CurrentAffairsItem.bulkWrite(ops, { ordered: false });
      console.log(`[dedupe] rehashed ${res.modifiedCount} survivor(s)`);
    }
  }

  const remaining = await CurrentAffairsItem.countDocuments();
  console.log(`[dedupe] records now: ${remaining}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[dedupe] failed:", err.message);
  process.exit(1);
});
