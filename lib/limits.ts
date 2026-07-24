// ── Submission limits ───────────────────────────────────────────────────────
// Single source of truth for the daily video submission cap, shared by the
// manual submit route and the TikTok submit route.

const DEFAULT_DAILY_LIMIT = 5;

/**
 * Videos a user may submit per day. Override with DAILY_VIDEO_LIMIT to raise
 * the cap for testing or staging without a code change. A non-numeric or
 * negative value falls back to the default rather than disabling the cap.
 */
export function dailyVideoLimit(): number {
  const raw = process.env.DAILY_VIDEO_LIMIT;
  if (!raw) return DEFAULT_DAILY_LIMIT;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_DAILY_LIMIT;
  return Math.floor(parsed);
}

/**
 * Start of the current submission day, in UTC.
 *
 * Deliberately UTC rather than `setHours(0,0,0,0)`: the latter uses whatever
 * timezone the host runs in, so the quota reset drifted between local dev
 * (Asia/Karachi) and production (UTC) — the same account saw two different
 * windows depending on where the code ran.
 */
export function dailyWindowStart(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** When the current window rolls over and the quota resets (UTC midnight). */
export function dailyWindowReset(): Date {
  const reset = dailyWindowStart();
  reset.setUTCDate(reset.getUTCDate() + 1);
  return reset;
}

/** Human-readable time until the quota resets, e.g. "3h 20m". */
export function timeUntilReset(now: Date = new Date()): string {
  const ms = Math.max(0, dailyWindowReset().getTime() - now.getTime());
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
