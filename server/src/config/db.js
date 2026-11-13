import mongoose from "mongoose";
import { env } from "./env.js";

const cacheKey = "__bdGovtDbCache";

function getCache() {
  if (!globalThis[cacheKey]) {
    globalThis[cacheKey] = { conn: null, promise: null };
  }
  return globalThis[cacheKey];
}

export async function connectDatabase() {
  const cache = getCache();

  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        console.log(`[DB] Connected to MongoDB (${m.connection.name})`);
        return m.connection;
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDatabase() {
  const cache = getCache();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
    console.log("[DB] Disconnected from MongoDB");
  }
}
