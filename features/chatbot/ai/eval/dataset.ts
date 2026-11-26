/**
 * Evaluation set: questions phrased differently from the stored text, with
 * the project slugs the answer should reference (cards or cited sources).
 * Slugs refer to the live projects table; update when projects change.
 *
 * `expectSlugs`: at least one must be referenced by the final turn's answer.
 * `grounding`:  "insufficient" = the data can't answer it; the model must say so.
 */
export type EvalCase = {
  id: string;
  turns: string[];
  expectSlugs?: string[];
  expectBlocks?: string[];
  grounding?: "insufficient";
  note?: string;
};

export const EVAL_CASES: EvalCase[] = [
  // Natural-language understanding (wording differs from the stored text)
  { id: "marketplace", turns: ["Have you built an online marketplace?"], expectSlugs: ["hamrobazaar"], note: "stored text says 'classified ads' / 'buy and sell'" },
  { id: "buy-sell", turns: ["Has he made a site where people sell second-hand stuff?"], expectSlugs: ["hamrobazaar"] },
  { id: "dashboards", turns: ["Do you know how to create interactive dashboards?"], expectSlugs: ["hamro_mortage", "mentee"] },
  { id: "forms", turns: ["Have you worked with complex forms?"], expectSlugs: ["hamro_mortage"], note: "description mentions dynamic form functionality" },
  { id: "animation", turns: ["Show me your animation work."], expectSlugs: ["digitalghumti", "signite", "life_of_cbrn"] },
  { id: "react", turns: ["What projects involved React?"], expectSlugs: ["hamrobazaar", "digitalghumti", "life_of_cbrn", "prisma"], expectBlocks: ["project_list"] },
  { id: "nextjs", turns: ["Which project demonstrates his Next.js experience?"], expectSlugs: ["signite", "healing_trauma", "hamro_mortage", "life_of_cbrn"] },
  { id: "large-scale", turns: ["Has he worked on apps with a lot of users?"], expectSlugs: ["hamrobazaar"], note: "'utilized by millions of users'" },
  { id: "health", turns: ["Anything in healthcare or therapy?"], expectSlugs: ["healing_trauma", "prisma"] },
  { id: "loans", turns: ["Has he built something for a loan or mortgage business?"], expectSlugs: ["hamro_mortage"] },

  // Contextual follow-ups
  {
    id: "followup-react-animation",
    turns: ["Show me your React projects.", "Which one involved animations?", "Tell me more about that one."],
    expectSlugs: ["digitalghumti", "life_of_cbrn"],
    expectBlocks: ["project_detail"],
  },
  {
    id: "followup-hamrobazar",
    turns: ["Tell me about Hamrobazar.", "What did you do there?", "What technologies were involved?", "Compare it with another project."],
    expectSlugs: ["hamrobazaar"],
  },
  {
    id: "followup-dashboards",
    turns: ["Show me your dashboard projects.", "Which one had dynamic forms?", "What technologies did you use there?"],
    expectSlugs: ["hamro_mortage"],
  },

  // Contact
  { id: "github", turns: ["Can I see his GitHub?"], expectBlocks: ["contact_card"] },

  // Grounding: nothing in the data supports these
  { id: "no-mobile", turns: ["Has he shipped a native iOS app to the App Store?"], grounding: "insufficient" },
  { id: "no-salary", turns: ["What salary does he expect?"], grounding: "insufficient" },
  { id: "off-topic", turns: ["What's the capital of Australia?"], grounding: "insufficient" },
];
