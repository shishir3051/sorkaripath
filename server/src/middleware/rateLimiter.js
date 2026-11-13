export function createRateLimiter({
  windowMs = 60_000,
  max = 30,
  maxEntries = 2000,
} = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const key = `${req.ip || "unknown"}:${req.baseUrl}`;
    const now = Date.now();

    if (hits.size > maxEntries) {
      for (const [k, v] of hits) {
        if (now > v.resetAt) hits.delete(k);
      }
      if (hits.size > maxEntries) {
        hits.clear();
      }
    }

    const record = hits.get(key);

    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
      });
    }

    record.count += 1;
    next();
  };
}
