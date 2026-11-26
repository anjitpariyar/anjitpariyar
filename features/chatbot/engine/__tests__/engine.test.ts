/**
 * Engine tests. Run with:  bun test features/chatbot
 *
 * Projects come from a snapshot of the live table; profile / skills / FAQs
 * mirror supabase/seed/portfolio_seed.sql. The experience rows are made-up
 * fixtures ("Example Studio") used only to exercise the experience paths.
 */
import { describe, expect, test } from "bun:test";
import type {
  ChatSuggestionRow,
  ExperienceRow,
  FaqRow,
  ProfileRow,
  SkillRow,
} from "../../types/database";
import { createChatEngine, createInitialContext, type ChatEngine } from "../index";
import { buildKnowledgeBase, type RawKnowledge } from "../knowledge";
import { normalize } from "../text";
import type { BotResponse, ChatBlock, ConversationContext } from "../types";
import { PROJECT_ROWS } from "./projects.fixture";

const ts = { created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };

const PROFILE: ProfileRow = {
  ...ts,
  id: "p1",
  full_name: "Anjit Pariyar",
  professional_title: "React Developer",
  short_bio: "Anjit Pariyar is a React developer from Nepal with 5 years of experience.",
  detailed_bio: "He developed a knack for adding animations to websites.",
  location: "Nepal",
  email: null,
  website: "https://www.anjitpariyar.com.np",
  github_url: "https://github.com/anjitpariyar",
  linkedin_url: "https://www.linkedin.com/in/anjit-pariyar-b46131178/",
  cv_url: null,
  other_links: [{ label: "Dribbble", url: "https://dribbble.com/limbo_anj" }],
  years_experience: 5,
  availability_status: null,
  additional_information: null,
  is_published: true,
};

const skill = (s: Partial<SkillRow> & Pick<SkillRow, "id" | "name" | "slug">): SkillRow => ({
  ...ts,
  category: "Frontend",
  description: null,
  aliases: [],
  related_skills: [],
  proficiency_label: null,
  years_experience: null,
  is_featured: false,
  sort_order: 0,
  is_published: true,
  ...s,
});

const SKILLS: SkillRow[] = [
  skill({ id: "s-react", name: "React", slug: "react", aliases: ["reactjs", "react.js"], is_featured: true }),
  skill({ id: "s-next", name: "Next.js", slug: "nextjs", aliases: ["next", "next js"], is_featured: true }),
  skill({ id: "s-js", name: "JavaScript", slug: "javascript", aliases: ["js"] }),
  skill({ id: "s-css", name: "CSS", slug: "css", category: "Styling" }),
  skill({
    id: "s-anim",
    name: "Web animation",
    slug: "web-animation",
    category: "Animation",
    description: "He has a knack for adding animations to websites.",
    aliases: ["animation", "animations", "motion"],
  }),
  skill({ id: "s-secret", name: "Cobol", slug: "cobol", is_published: false }),
];

const exp = (e: Partial<ExperienceRow> & Pick<ExperienceRow, "id" | "company" | "position">): ExperienceRow => ({
  ...ts,
  employment_type: "Full-time",
  description: null,
  responsibilities: [],
  start_date: "2022-01-01",
  end_date: null,
  is_current: true,
  technologies: [],
  company_url: null,
  sort_order: 0,
  is_published: true,
  ...e,
});

const EXPERIENCES: ExperienceRow[] = [
  exp({ id: "e1", company: "Example Studio", position: "Frontend Developer", technologies: ["React", "GSAP"], description: "Built marketing dashboards." }),
  exp({ id: "e-hidden", company: "Hidden Corp", position: "Intern", is_published: false }),
];

const faq = (f: Partial<FaqRow> & Pick<FaqRow, "id" | "question" | "answer">): FaqRow => ({
  ...ts,
  keywords: [],
  category: null,
  related_project_ids: [],
  sort_order: 0,
  is_published: true,
  ...f,
});

const FAQS: FaqRow[] = [
  faq({
    id: "f1",
    question: "What kind of projects does Anjit build?",
    answer: "Mostly web apps built with React and Next.js.",
    keywords: ["kind of projects", "type of projects"],
  }),
  faq({
    id: "f2",
    question: "What is his preferred frontend stack?",
    answer: "He builds web apps with React and Next.js.",
    keywords: ["preferred stack", "preferred frontend"],
  }),
  faq({ id: "f-hidden", question: "Secret?", answer: "Hidden answer", keywords: ["secret"], is_published: false }),
];

const SUGGESTIONS: ChatSuggestionRow[] = [
  { ...ts, id: "g1", label: "Projects", message: "Show me your projects", category: null, sort_order: 1, is_published: true },
];

const RAW: RawKnowledge = {
  profile: PROFILE,
  projects: PROJECT_ROWS,
  skills: SKILLS,
  experiences: EXPERIENCES,
  faqs: FAQS,
  suggestions: SUGGESTIONS,
};

// ---------------------------------------------------------------------------

function conversation(engine: ChatEngine) {
  let context: ConversationContext = createInitialContext();
  return (message: string): BotResponse => {
    const turn = engine.respond(message, context);
    context = turn.context;
    return turn.response;
  };
}

const textOf = (r: BotResponse) =>
  r.blocks.filter((b): b is Extract<ChatBlock, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n");

const blockOf = <T extends ChatBlock["type"]>(r: BotResponse, type: T) =>
  r.blocks.find((b): b is Extract<ChatBlock, { type: T }> => b.type === type);

const titlesOf = (engine: ChatEngine, r: BotResponse) =>
  blockOf(r, "project_list")?.projectIds.map((id) => engine.index.projectById.get(id)!.title.trim()) ?? [];

const kb = buildKnowledgeBase(RAW);
const engine = createChatEngine(kb);

// ---------------------------------------------------------------------------

describe("knowledge base", () => {
  test("parses free-text tech stacks into canonical technologies", () => {
    const byTitle = Object.fromEntries(kb.projects.map((p) => [p.title.trim(), p.technologies.map((t) => t.key)]));
    expect(byTitle["Hamrobazar"]).toEqual(["react", "redux", "reduxsaga", "realtimedb"]);
    expect(byTitle["Digital Ghumti"]).toEqual(["react", "cssanimation", "reactspring"]);
    expect(byTitle["Life of Canberran"]).toEqual(["nextjs", "framermotion", "react", "tailwind"]);
    expect(byTitle["PRISM NEURO"]).toEqual(["react", "redux", "tanstackrouter", "tanstackquery"]);
    expect(byTitle["Gomentee"]).toEqual(["html", "css", "javascript", "php"]);
  });

  test("strips HTML from descriptions", () => {
    const hb = kb.projects.find((p) => p.slug === "hamrobazaar")!;
    expect(hb.description).not.toContain("<br");
    expect(hb.summary.startsWith("Hamrobazar is a classified ads site")).toBe(true);
  });

  test("16. unpublished / inactive records are never exposed", () => {
    expect(kb.projects.some((p) => p.slug === "gyre")).toBe(false);
    expect(kb.skills.some((s) => s.name === "Cobol")).toBe(false);
    expect(kb.experiences.some((e) => e.company === "Hidden Corp")).toBe(false);
    expect(kb.faqs.some((f) => f.id === "f-hidden")).toBe(false);
    expect(buildKnowledgeBase({ ...RAW, profile: { ...PROFILE, is_published: false } }).profile).toBeNull();

    const say = conversation(engine);
    expect(textOf(say("Tell me about WithGyre"))).not.toContain("WithGyre");
    expect(say("Have you worked with Cobol?").blocks.some((b) => b.type === "skill_grid")).toBe(false);
    expect(say("secret").intent).not.toBe("faq");
  });
});

describe("conversation scenarios", () => {
  test("1. greeting", () => {
    const r = conversation(engine)("Hi!");
    expect(r.intent).toBe("greeting");
    expect(textOf(r)).toContain("Anjit's portfolio assistant");
  });

  test("2. about Anjit", () => {
    const r = conversation(engine)("Who is Anjit?");
    expect(r.intent).toBe("about");
    expect(textOf(r)).toContain("Anjit Pariyar is a React Developer based in Nepal");
  });

  test("3. professional experience", () => {
    const r = conversation(engine)("Tell me about your experience.");
    expect(r.intent).toBe("experience");
    expect(blockOf(r, "experience_list")?.experienceIds).toEqual(["e1"]);
  });

  test("3b. experience with no records says so instead of inventing", () => {
    const empty = createChatEngine(buildKnowledgeBase({ ...RAW, experiences: [] }));
    const r = conversation(empty)("Where have you worked?");
    expect(r.intent).toBe("experience");
    expect(textOf(r)).toContain("don't have Anjit's employment history on record");
    expect(textOf(r)).toContain("5 years");
  });

  test("4. show all projects", () => {
    const r = conversation(engine)("Show me your projects");
    expect(r.intent).toBe("projects");
    expect(blockOf(r, "project_list")?.projectIds.length).toBe(8);
  });

  test("5. React projects (explicitly listed only)", () => {
    const r = conversation(engine)("Show me your React projects");
    expect(r.intent).toBe("projects");
    expect(titlesOf(engine, r)).toEqual(["Hamrobazar", "Digital Ghumti", "Life of Canberran", "PRISM NEURO"]);
    expect(textOf(r)).toContain("Next.js is a React framework"); // pointer, not a claim
  });

  test("6. Next.js projects, plus 'which ones' refinement", () => {
    const say = conversation(engine);
    say("Show me your projects");
    const r = say("Which ones use Next.js?");
    expect(r.intent).toBe("projects");
    expect(titlesOf(engine, r)).toEqual(["Signite", "Healing Trauma", "Hamro Mortage", "Life of Canberran"]);
  });

  test("7–9. specific project, follow-up, and technologies via 'there'", () => {
    const say = conversation(engine);
    const r1 = say("Tell me more about Hamrobazar.");
    expect(r1.intent).toBe("project_details");
    expect(blockOf(r1, "project_detail")?.projectId).toBe(1);

    const r2 = say("What was your contribution to this project?");
    expect(r2.intent).toBe("project_details");
    expect(blockOf(r2, "project_detail")?.focus).toBe("contribution");
    expect(textOf(r2)).toContain("I have contributed to the development");

    const r3 = say("What technologies did you use there?");
    expect(r3.intent).toBe("project_details");
    expect(textOf(r3)).toBe("Hamrobazar lists React, Redux, Redux-Saga and Realtime Database in its stack.");
  });

  test("ordinal reference into previous results", () => {
    const say = conversation(engine);
    say("Show me your projects");
    say("Which ones use Next.js?");
    const r = say("Tell me more about the first one.");
    expect(r.intent).toBe("project_details");
    expect(engine.index.projectById.get(blockOf(r, "project_detail")!.projectId)!.title).toBe("Signite");
    const last = say("and the last one?");
    expect(engine.index.projectById.get(blockOf(last, "project_detail")!.projectId)!.title).toBe("Life of Canberran");
  });

  test("fuzzy project names", () => {
    const say = conversation(engine);
    expect(blockOf(say("tell me about hamro bazaar"), "project_detail")?.projectId).toBe(1);
    expect(blockOf(say("what is hamro mortgage?"), "project_detail")?.projectId).toBe(3);
    expect(blockOf(say("prism neuro details"), "project_detail")?.projectId).toBe(16);
  });

  test("'prisma' means the ORM, not the PRISM NEURO slug", () => {
    const r = conversation(engine)("Have you used Prisma?");
    expect(r.intent).toBe("technology_experience");
    expect(titlesOf(engine, r)).toEqual(["Hamro Mortage"]);
  });

  test("10. animation experience combines skills, projects and experience", () => {
    const r = conversation(engine)("Do you have experience with animations?");
    expect(r.intent).toBe("technology_experience");
    expect(blockOf(r, "skill_grid")?.skillIds).toEqual(["s-anim"]);
    expect(titlesOf(engine, r)).toEqual(["Digital Ghumti", "Signite", "Life of Canberran"]);
    expect(blockOf(r, "experience_list")?.experienceIds).toEqual(["e1"]);
  });

  test("technology experience with evidence", () => {
    const r = conversation(engine)("Have you worked with Next.js?");
    expect(r.intent).toBe("technology_experience");
    expect(textOf(r)).toStartWith("Yes — Next.js: it's listed among his skills and it's used in 4 of his projects");
  });

  test("TypeScript: no records, so no claim", () => {
    const r = conversation(engine)("What projects have you built using TypeScript?");
    expect(r.intent).toBe("projects");
    expect(textOf(r)).toContain("couldn't find any projects that list TypeScript");
  });

  test("unknown technology is not claimed", () => {
    const r = conversation(engine)("Have you worked with Vue?");
    expect(textOf(r)).toContain("I don't have any record of Anjit working with Vue");
  });

  test("dashboards: topic search over descriptions and screenshots", () => {
    const r = conversation(engine)("Have you worked with dashboards?");
    expect(titlesOf(engine, r)).toEqual(["Gomentee", "Hamro Mortage", "PRISM NEURO"]);
    expect(blockOf(r, "experience_list")?.experienceIds).toEqual(["e1"]);
  });

  test("skills, grouped grid", () => {
    const r = conversation(engine)("What technologies do you work with?");
    expect(r.intent).toBe("skills");
    expect(blockOf(r, "skill_grid")?.skillIds.length).toBe(5);
  });

  test("11. contact, GitHub and missing CV", () => {
    const say = conversation(engine);
    const r = say("How can I contact you?");
    expect(r.intent).toBe("contact");
    expect(blockOf(r, "contact_card")).toBeDefined();
    expect(blockOf(say("Can I see your GitHub?"), "contact_card")?.highlight).toBe("github");
    expect(textOf(say("Do you have a CV?"))).toContain("I don't have a CV link on record");
  });

  test("availability without data is not invented", () => {
    const r = conversation(engine)("Is Anjit available for freelance work?");
    expect(r.intent).toBe("availability");
    expect(textOf(r)).toContain("I don't have confirmed availability information");
  });

  test("FAQ match", () => {
    const r = conversation(engine)("What is his preferred frontend stack?");
    expect(r.intent).toBe("faq");
    expect(blockOf(r, "faq_card")?.faqIds).toEqual(["f2"]);
  });

  test("12. unrelated question", () => {
    const r = conversation(engine)("What's the weather in Paris tomorrow?");
    expect(r.intent).toBe("unknown");
    expect(textOf(r)).toContain("I don't have a confirmed answer for that");
  });

  test("13. ambiguous question asks for clarification", () => {
    const r = conversation(engine)("Tell me more about it");
    expect(r.intent).toBe("project_details");
    expect(textOf(r)).toStartWith("Which project would you like to know about?");
    expect(r.suggestions[0]).toStartWith("Tell me about ");
  });

  test("13b. partial name shared by two projects asks which one", () => {
    const say = conversation(engine);
    const r = say("hamro");
    expect(textOf(r)).toBe("Did you mean Hamrobazar or Hamro Mortage?");
    expect(r.suggestions).toEqual(["Tell me about Hamrobazar", "Tell me about Hamro Mortage"]);
    expect(blockOf(say("the second one"), "project_detail")?.projectId).toBe(3);
  });

  test("short project follow-up beats the generic skills reading", () => {
    const say = conversation(engine);
    say("Tell me about Signite");
    const r = say("and the tech stack?");
    expect(r.intent).toBe("project_details");
    expect(textOf(r)).toBe("Signite lists Next.js and Framer Motion in its stack.");
    // ...but a general question still gets the general answer
    expect(say("What technologies do you work with?").intent).toBe("skills");
  });

  test("'what's next' is not Next.js", () => {
    expect(conversation(engine)("so what's next?").intent).not.toBe("technology_experience");
  });

  test("works with an empty knowledge base (migration not applied yet)", () => {
    const bare = createChatEngine(
      buildKnowledgeBase({ profile: null, projects: PROJECT_ROWS, skills: [], experiences: [], faqs: [], suggestions: [] })
    );
    const say = conversation(bare);
    expect(textOf(say("Who is Anjit?"))).toContain("don't have Anjit's profile details");
    expect(textOf(say("What are your skills?"))).toContain("these technologies appear in Anjit's projects");
    expect(titlesOf(bare, say("React projects"))).toHaveLength(4);
  });
});

describe("normalize", () => {
  test("keeps tech punctuation, drops sentence punctuation", () => {
    expect(normalize("Have you worked with Next.js?")).toBe("have you worked with next.js");
    expect(normalize("What’s next.")).toBe("whats next");
  });
});
