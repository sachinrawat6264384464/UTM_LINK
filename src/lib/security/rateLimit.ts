// In-memory lightweight token bucket rate limiter for API route protection

interface RateBucket {
  tokens: number;
  lastRefill: number;
}

const ipBuckets = new Map<string, RateBucket>();
const MAX_TOKENS = 60; // 60 requests
const REFILL_RATE_MS = 60000; // per 1 minute

export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  let bucket = ipBuckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS - 1, lastRefill: now };
    ipBuckets.set(identifier, bucket);
    return false;
  }

  // Refill tokens
  const timeElapsed = now - bucket.lastRefill;
  if (timeElapsed > REFILL_RATE_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return false;
  }

  return true; // Limit exceeded
}
