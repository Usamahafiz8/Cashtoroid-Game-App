import type { Brief } from "@prisma/client";

// One block on the Brief & Guidelines screen: a heading followed by one or more
// lines of copy. Clients render `description` as a bullet/paragraph list.
export type BriefSection = {
  heading: string;
  description: string[];
};

// Served when no brief row exists yet, when the brief is toggled off, or when
// the stored sections are empty/malformed — the screen is never blank.
export const DEFAULT_BRIEF_SECTIONS: BriefSection[] = [
  {
    heading: "What are you looking for:",
    description: [
      "Create fun, authentic content that makes people want to download and play Cashteroid.",
    ],
  },
  {
    heading: "Great content ideas:",
    description: [
      "🚀 Epic gameplay moments, high scores, and close finishes.",
      "💬 Natural POV videos talking about your experience and any winnings.",
      '💵 "Best real cash games" or "Apps that actually pay" slideshow videos featuring Cashteroid.',
      "🎯 Tips, tricks, or satisfying gameplay clips that show why the game is fun.",
    ],
  },
  {
    heading: "Keep it authentic:",
    description: [
      "Be yourself—don't sound like an advertisement.",
      "Hook viewers in the first 3 seconds.",
      "Always include a clear call to action, such as:",
      '1- "Download Cashteroid and challenge me!"',
      '2- "Think you can beat my score?"',
      '3- "Try Cashteroid and see how high you can rank!"',
    ],
  },
  {
    heading: "Don't forget:",
    description: [
      "Include #Cashteroid in your caption.",
      "Encourage viewers to download and play.",
      "Be creative—original, engaging content performs best!",
    ],
  },
  {
    heading: "Rules:",
    description: [
      "No illegal stuff, racism or sexual content. Buying views will get you banned.",
    ],
  },
  {
    heading: "Inspirational Links:",
    description: ["(section for links users can check for inspiration)"],
  },
];

function isBriefSection(value: unknown): value is BriefSection {
  if (typeof value !== "object" || value === null) return false;
  const section = value as Record<string, unknown>;
  return (
    typeof section.heading === "string" &&
    Array.isArray(section.description) &&
    section.description.every((line) => typeof line === "string")
  );
}

// Prisma types Json as `JsonValue`, so narrow it back to the shape we write.
export function parseBriefSections(value: unknown): BriefSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isBriefSection);
}

// Public payload: just the ordered sections, falling back to the defaults.
export function toBriefSections(brief: Brief | null): BriefSection[] {
  if (!brief || !brief.isActive) return DEFAULT_BRIEF_SECTIONS;
  const sections = parseBriefSections(brief.sections);
  return sections.length > 0 ? sections : DEFAULT_BRIEF_SECTIONS;
}

// Admin payload: the stored sections verbatim plus the edit metadata.
export function toBriefDTO(brief: Brief) {
  return {
    sections: parseBriefSections(brief.sections),
    isActive: brief.isActive,
    updatedAt: brief.updatedAt,
  };
}

export const DEFAULT_BRIEF_DTO = {
  sections: DEFAULT_BRIEF_SECTIONS,
  isActive: false,
  updatedAt: null as Date | null,
};
