import { createHmac } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { getAuthEnv } from "@/lib/env";

type Rule = {
  scope: string;
  subject: string;
  limit: number;
  windowSeconds: number;
  blockSeconds: number;
};

type RateLimitRow = RowDataPacket & {
  attempts: number;
  retry_after: number;
};

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfter: number) {
    super("RATE_LIMIT_EXCEEDED");
  }
}

const positiveInteger = (value: number, name: string) => {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
};

const keyFor = (scope: string, subject: string) =>
  createHmac("sha256", getAuthEnv().AUTH_SECRET).update(`${scope}\0${subject}`).digest();

export function requestAddress(request: Request) {
  const candidate =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  return candidate.trim().slice(0, 128) || "unknown";
}

export async function consumeRateLimit(rule: Rule) {
  const limit = positiveInteger(rule.limit, "limit");
  const windowSeconds = positiveInteger(rule.windowSeconds, "windowSeconds");
  const blockSeconds = positiveInteger(rule.blockSeconds, "blockSeconds");
  const db = getDb();
  const keyHash = keyFor(rule.scope, rule.subject);

  // All interpolated values are validated integers owned by server code. User input is parameterized.
  await db.execute(
    `INSERT INTO auth_rate_limits (scope,key_hash,window_started_at,attempts,blocked_until)
     VALUES (?,?,NOW(),1,NULL)
     ON DUPLICATE KEY UPDATE
       blocked_until=CASE
         WHEN blocked_until>NOW() THEN blocked_until
         WHEN window_started_at<DATE_SUB(NOW(),INTERVAL ${windowSeconds} SECOND) THEN NULL
         WHEN attempts+1>${limit} THEN DATE_ADD(NOW(),INTERVAL ${blockSeconds} SECOND)
         ELSE NULL
       END,
       attempts=IF(window_started_at<DATE_SUB(NOW(),INTERVAL ${windowSeconds} SECOND),1,attempts+1),
       window_started_at=IF(window_started_at<DATE_SUB(NOW(),INTERVAL ${windowSeconds} SECOND),NOW(),window_started_at),
       updated_at=NOW()`,
    [rule.scope, keyHash],
  );

  const [rows] = await db.execute<RateLimitRow[]>(
    "SELECT attempts,GREATEST(0,COALESCE(TIMESTAMPDIFF(SECOND,NOW(),blocked_until),0)) retry_after FROM auth_rate_limits WHERE scope=? AND key_hash=?",
    [rule.scope, keyHash],
  );
  const state = rows[0];
  if (state && (Number(state.retry_after) > 0 || Number(state.attempts) > limit)) {
    throw new RateLimitExceededError(Math.max(1, Number(state.retry_after) || blockSeconds));
  }
}

export async function enforceRateLimits(rules: Rule[]) {
  for (const rule of rules) await consumeRateLimit(rule);
}
