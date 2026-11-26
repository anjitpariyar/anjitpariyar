import { z } from "zod";

/**
 * What the model must return. Deliberately flat (one block shape with
 * optional fields) because flat schemas are the most reliable across
 * structured-output implementations. The server converts and validates it
 * into the app's ChatBlock union; nothing here is rendered directly.
 */
export const BLOCK_TYPES = [
  "project_list",
  "project_detail",
  "skill_grid",
  "experience_list",
  "contact_card",
  "faq_card",
] as const;

export const INTENTS = [
  "greeting",
  "about",
  "experience",
  "projects",
  "project_details",
  "skills",
  "technology_experience",
  "contact",
  "availability",
  "faq",
  "help",
  "unknown",
] as const;

export const SOURCE_TYPES = ["profile", "project", "skill", "experience", "faq"] as const;

export const ModelBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES).describe("An approved UI card type."),
  ids: z
    .array(z.string())
    .describe("Record ids copied exactly from the portfolio data or tool results for this card type. Empty for contact_card."),
  focus: z
    .enum(["overview", "technologies", "contribution", "links"])
    .optional()
    .describe("project_detail only: which aspect the card should emphasise."),
  highlight: z
    .enum(["email", "github", "linkedin", "cv", "website"])
    .optional()
    .describe("contact_card only: which contact row to highlight."),
});

export const ModelOutputSchema = z.object({
  answer: z
    .string()
    .min(1)
    .describe("Conversational plain-text answer (no markdown). Short paragraphs separated by blank lines."),
  basis: z
    .enum(["confirmed", "interpretation", "insufficient"])
    .describe(
      "confirmed: every claim is stated in the portfolio data. interpretation: includes reasoned relevance beyond explicit facts (and the answer says so). insufficient: the data does not answer the question."
    ),
  intent: z.enum(INTENTS).describe("What the visitor is asking about."),
  blocks: z.array(ModelBlockSchema).describe("0-3 cards that help the answer. Never invent ids."),
  suggestions: z.array(z.string()).describe("2-4 short follow-up questions the visitor might ask next, answerable from the portfolio."),
  sources: z
    .array(z.object({ sourceType: z.enum(SOURCE_TYPES), sourceId: z.string() }))
    .describe("Portfolio records the answer relies on, using their ids."),
});

export type ModelOutput = z.infer<typeof ModelOutputSchema>;
export type ModelBlock = z.infer<typeof ModelBlockSchema>;

/** JSON Schema for the provider's structured-output mode. */
export function modelOutputJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ModelOutputSchema, { target: "draft-2020-12" }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}
