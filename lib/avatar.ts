// ── Initial avatars ─────────────────────────────────────────────────────────
// Generates a placeholder avatar built from a user's initial on a colored
// circle (via ui-avatars.com). Used as a default until a user uploads their own.

// Curated background palette, tuned to the app's color scheme.
const AVATAR_COLORS = [
  "e94560", "0f3460", "16213e", "533483", "1a936f",
  "3a86ff", "fb5607", "ff006e", "8338ec", "06d6a0",
  "ef476f", "118ab2", "073b4c", "f4a261", "2a9d8f",
];

/** Pick a random background color (hex, no leading "#"). */
export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/**
 * Build an initials-based avatar URL for a name/username.
 * Uses the first character as the initial on a colored background.
 *
 * @param name  Username or display name — its first char becomes the initial.
 * @param color Background hex (no "#"). Defaults to a random palette color.
 */
export function generateInitialAvatarUrl(name: string, color = randomAvatarColor()): string {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  const params = new URLSearchParams({
    name: initial,
    background: color,
    color: "ffffff",
    size: "128",
    bold: "true",
    "font-size": "0.5",
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}
