import type { SkillCategory } from "../types/database";

export type { SkillCategory };

// ---------------------------------------------------------------------------
// Knowledge base: normalized, JSON-serializable snapshot of Supabase content.
// Built on the server (getStaticProps) and passed to the page as props.
// ---------------------------------------------------------------------------

export type TechRef = { key: string; label: string };

export type Project = {
  id: number;
  slug: string;
  title: string;
  thumbnail: string | null;
  link: string | null;
  /** Plain text (HTML stripped), paragraphs separated by blank lines. */
  description: string;
  /** First paragraph of the description. */
  summary: string;
  /** The raw `languages` column, as written in the database. */
  technologiesText: string;
  /** Technologies recognised in `languages`, in canonical form. */
  technologies: TechRef[];
  imageTitles: string[];
  isPinned: boolean;
  /** Optional columns; null / [] until filled in Supabase. */
  contribution: string | null;
  features: string[];
  category: string | null;
  githubUrl: string | null;
};

export type ProfileLink = { label: string; url: string };

export type Profile = {
  fullName: string;
  title: string | null;
  shortBio: string | null;
  detailedBio: string | null;
  location: string | null;
  email: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  cvUrl: string | null;
  otherLinks: ProfileLink[];
  yearsExperience: number | null;
  availability: string | null;
  additionalInformation: string | null;
};

export type Skill = {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  description: string | null;
  aliases: string[];
  relatedSkills: string[];
  proficiencyLabel: string | null;
  yearsExperience: number | null;
  isFeatured: boolean;
};

export type Experience = {
  id: string;
  company: string;
  position: string;
  employmentType: string | null;
  description: string | null;
  responsibilities: string[];
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  technologies: string[];
  companyUrl: string | null;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string | null;
  relatedProjectIds: number[];
};

export type Suggestion = {
  id: string;
  label: string;
  message: string;
  category: string | null;
};

export type KnowledgeBase = {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  faqs: Faq[];
  suggestions: Suggestion[];
  /** ISO timestamp of when this snapshot was read from Supabase. */
  loadedAt: string;
};

// ---------------------------------------------------------------------------
// Response blocks: the only things the UI knows how to render.
// They reference knowledge-base records by id; the renderer resolves them.
// ---------------------------------------------------------------------------

export type ProjectFocus = "overview" | "technologies" | "contribution" | "links";
export type ContactHighlight = "email" | "github" | "linkedin" | "cv" | "website";

export type ChatBlock =
  | { type: "text"; text: string }
  | { type: "project_list"; projectIds: number[] }
  | { type: "project_detail"; projectId: number; focus: ProjectFocus }
  | { type: "skill_grid"; skillIds: string[] }
  | { type: "experience_list"; experienceIds: string[] }
  | { type: "contact_card"; highlight: ContactHighlight | null }
  | { type: "faq_card"; faqIds: string[] };

export type ChatBlockType = ChatBlock["type"];

// ---------------------------------------------------------------------------
// Intents, entities, context
// ---------------------------------------------------------------------------

export type Intent =
  | "greeting"
  | "about"
  | "experience"
  | "projects"
  | "project_details"
  | "skills"
  | "technology_experience"
  | "contact"
  | "availability"
  | "faq"
  | "help"
  | "unknown";

export type Entities = {
  /** Projects named explicitly in the message. */
  projectIds: number[];
  /** A partial name that fits several projects ("hamro"). */
  ambiguousProjectIds: number[];
  /** Project resolved from context ("it", "there", "the first one"). */
  referencedProjectId: number | null;
  /** Experience resolved from an ordinal ("the second one"). */
  referencedExperienceId: string | null;
  /** Canonical technology keys. */
  technologies: string[];
  categories: SkillCategory[];
  companyExperienceIds: string[];
  /** Content words left after removing known vocabulary; used for topic search. */
  topicTerms: string[];
  /** True when the message contains "it/there/this/that (one|project)". */
  hasReference: boolean;
  ordinal: number | null;
};

export type IntentResult = {
  intent: Intent;
  confidence: number;
  scores: Partial<Record<Intent, number>>;
  /** Second-best intent when it scored close to the winner. */
  alternative: Intent | null;
};

export type ResultSet =
  | { type: "projects"; ids: number[] }
  | { type: "experiences"; ids: string[] }
  | { type: "skills"; ids: string[] };

export type ConversationContext = {
  lastIntent: Intent | null;
  lastProjectId: number | null;
  lastTechnology: string | null;
  lastCategory: SkillCategory | null;
  lastResults: ResultSet | null;
  turn: number;
};

export type BotResponse = {
  blocks: ChatBlock[];
  suggestions: string[];
  intent: Intent;
  confidence: number;
};

// ---------------------------------------------------------------------------
// Chat transcript (what gets persisted to localStorage)
// ---------------------------------------------------------------------------

export type MessageSource = {
  sourceType: "profile" | "project" | "skill" | "experience" | "faq";
  sourceId: string;
  label: string;
  href: string | null;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string; createdAt: number }
  | {
      id: string;
      role: "assistant";
      blocks: ChatBlock[];
      suggestions: string[];
      intent: Intent;
      createdAt: number;
      /** Portfolio records the answer was grounded on (AI mode). */
      sources?: MessageSource[];
      /** "ai" = Gemini; "fallback" = rule-based engine. */
      mode?: "ai" | "fallback";
      basis?: "confirmed" | "interpretation" | "insufficient" | null;
    }
  | {
      id: string;
      role: "error";
      text: string;
      /** The user message to resend on retry. */
      retryText: string;
      createdAt: number;
    };
