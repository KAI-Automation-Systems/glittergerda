import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
type SecurityState = {
  buckets: Map<string, Bucket>;
  activeGenerations: number;
};

const state = globalThis as typeof globalThis & {
  glitterSecurity?: SecurityState;
};

const security =
  state.glitterSecurity ??
  (state.glitterSecurity = {
    buckets: new Map<string, Bucket>(),
    activeGenerations: 0,
  });

const rateLimitSalt =
  process.env.RATE_LIMIT_SALT || randomBytes(16).toString("hex");

function anonymize(value: string) {
  return createHash("sha256")
    .update(rateLimitSalt)
    .update(value)
    .digest("hex");
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
export function checkGenerationLimit(ip: string) {
  const now = Date.now();
  const key = anonymize(ip);
  const limit = positiveInt(process.env.GENERATION_RATE_LIMIT, 5);
  const windowMs = positiveInt(
    process.env.GENERATION_RATE_WINDOW_MS,
    10 * 60 * 1000
  );

  if (security.buckets.size > 10_000) {
    for (const [key, bucket] of security.buckets) {
      if (bucket.resetAt <= now) security.buckets.delete(key);
    }
  }

  const current = security.buckets.get(key);
  if (!current || current.resetAt <= now) {
    security.buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}
export function acquireGenerationSlot() {
  const maximum = positiveInt(process.env.GENERATION_CONCURRENCY, 2);
  if (security.activeGenerations >= maximum) return null;

  security.activeGenerations += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    security.activeGenerations = Math.max(0, security.activeGenerations - 1);
  };
}

export async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (ip !== "local") body.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body, signal: AbortSignal.timeout(8_000) }
  );
  if (!response.ok) return false;

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
