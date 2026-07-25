import type { Brief } from "@prisma/client";

// Shape returned to clients: earnings collapsed into a nested object,
// matching the Brief & Guidelines screen design instead of the flat DB columns.
export function toBriefDTO(brief: Brief) {
  return {
    projectTitle: brief.projectTitle,
    titleDescription: brief.titleDescription,
    descriptionTitle: brief.descriptionTitle,
    description: brief.description,
    instructionsTitle: brief.instructionsTitle,
    instructions: brief.instructions,
    earnings: {
      likes: brief.earningsLikes,
      comments: brief.earningsComments,
      views: brief.earningsViews,
      total: brief.earningsLikes + brief.earningsComments + brief.earningsViews,
      currency: brief.earningsCurrency,
    },
    rules: brief.rules,
    isActive: brief.isActive,
    updatedAt: brief.updatedAt,
  };
}

export const DEFAULT_BRIEF_DTO = {
  projectTitle: "",
  titleDescription: "",
  descriptionTitle: "",
  description: "",
  instructionsTitle: "",
  instructions: [] as unknown,
  earnings: { likes: 0, comments: 0, views: 0, total: 0, currency: "USD" },
  rules: [] as string[],
  isActive: false,
  updatedAt: null as Date | null,
};
