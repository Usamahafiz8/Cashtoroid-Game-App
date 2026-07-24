// ── Number formatting ───────────────────────────────────────────────────────

const UNITS = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
] as const;

/**
 * Compact view counts for leaderboards and tables.
 *
 *   999 → "999"          1_500 → "1.5K"        2_000_000 → "2M"
 *   999_999 → "1M"       1_250_000_000 → "1.3B"
 *
 * One decimal place, with a trailing ".0" dropped so round numbers read as
 * "2M" rather than "2.0M". The 0.9995 factor makes a value pick the larger
 * unit when it would otherwise round up into it — without it, 999,999
 * renders as the nonsensical "1000.0K".
 */
export function formatViews(n: number): string {
  if (!Number.isFinite(n)) return "0";

  for (const { value, suffix } of UNITS) {
    if (Math.abs(n) < value * 0.9995) continue;
    return `${Number((n / value).toFixed(1))}${suffix}`;
  }

  return String(Math.round(n));
}
