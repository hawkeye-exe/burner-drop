import { createHash, randomBytes } from "node:crypto";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const EPHEMERAL_SALT = randomBytes(16);

const requestLog = new Map<string, number[]>();

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(EPHEMERAL_SALT)
    .update(ip, "utf8")
    .digest("hex");
}

function getActiveTimestamps(hashedIp: string, now: number): number[] {
  const timestamps = requestLog.get(hashedIp) ?? [];
  const activeTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (activeTimestamps.length > 0) {
    requestLog.set(hashedIp, activeTimestamps);
  } else {
    requestLog.delete(hashedIp);
  }

  return activeTimestamps;
}

function createRateLimitError(): Error & { status: number } {
  const error = new Error("Too many requests");

  return Object.assign(error, { status: 429 });
}

export function applyRateLimit(ip: string): void {
  const now = Date.now();
  const hashedIp = hashIp(ip);
  const activeTimestamps = getActiveTimestamps(hashedIp, now);

  if (activeTimestamps.length >= MAX_REQUESTS) {
    throw createRateLimitError();
  }

  activeTimestamps.push(now);
  requestLog.set(hashedIp, activeTimestamps);
}

export function getRemainingRequests(ip: string): number {
  const now = Date.now();
  const hashedIp = hashIp(ip);
  const activeTimestamps = getActiveTimestamps(hashedIp, now);

  return Math.max(0, MAX_REQUESTS - activeTimestamps.length);
}
