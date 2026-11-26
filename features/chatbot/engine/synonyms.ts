import type { Intent, SkillCategory } from "./types";

/**
 * Built-in technology vocabulary.
 *
 * This is *recognition* vocabulary only: it lets the bot understand that
 * "REACTJS", "React18" and "react.js" all mean React. It never implies that
 * Anjit knows a technology. Claims always come from Supabase rows (skills,
 * projects.languages, experiences.technologies).
 *
 * Skills in `portfolio_skills` extend this list at runtime via their name
 * and `aliases`, so new technologies can be added without a deploy.
 *
 * Patterns run against `normalize()`d text.
 */
export type TechDefinition = {
  label: string;
  category: SkillCategory;
  patterns: RegExp[];
};

const W = "(?<![a-z0-9])"; // word start
const E = "(?![a-z0-9])"; // word end

const re = (body: string) => new RegExp(`${W}(?:${body})${E}`, "g");

export const TECHNOLOGIES: Record<string, TechDefinition> = {
  react: {
    label: "React",
    category: "Frontend",
    // "react", "reactjs", "react.js", "react 18" — but not "react spring",
    // "react native", "react query" or "react router", which are their own things.
    patterns: [
      re(
        "react(?:\\s?js|\\.js|\\s?1[5-9])?(?![a-z0-9])(?![\\s-]*(?:spring|native|query|router))"
      ),
    ],
  },
  nextjs: {
    label: "Next.js",
    category: "Frontend",
    patterns: [
      re("next\\s?\\.?\\s?js"),
      // bare "next" only in "with/using/in next" so "what's next" doesn't match
      /(?<=(?:with|using|use|in|know|about|on|of)\s)next(?![a-z0-9.])(?!\s+(?:one|project|step|time|week|month|year|job|role))/g,
    ],
  },
  javascript: {
    label: "JavaScript",
    category: "Frontend",
    // "js" alone, but not the "js" in "next js" / "react js" / "node js"
    patterns: [
      re("javascript|ecmascript|es6|vanilla js"),
      /(?<!(?:next|react|node|vue|nest|three|express)[\s.]?)(?<![a-z0-9.])js(?![a-z0-9])/g,
    ],
  },
  typescript: { label: "TypeScript", category: "Frontend", patterns: [re("typescript|ts")] },
  html: { label: "HTML", category: "Frontend", patterns: [re("html5?")] },
  css: { label: "CSS", category: "Styling", patterns: [re("css3?")] },
  sass: { label: "Sass", category: "Styling", patterns: [re("sass|scss")] },
  tailwind: { label: "Tailwind CSS", category: "Styling", patterns: [re("tailwind(?:\\s?css)?")] },
  styledcomponents: {
    label: "styled-components",
    category: "Styling",
    patterns: [re("styled[\\s-]?components?")],
  },
  redux: {
    label: "Redux",
    category: "Frontend",
    patterns: [re("redux(?![\\s-]*(?:saga|toolkit))|redux[\\s-]*toolkit|rtk")],
  },
  reduxsaga: { label: "Redux-Saga", category: "Frontend", patterns: [re("redux[\\s-]*saga")] },
  jotai: { label: "Jotai", category: "Frontend", patterns: [re("jotai")] },
  zustand: { label: "Zustand", category: "Frontend", patterns: [re("zustand")] },
  tanstackquery: {
    label: "TanStack Query",
    category: "Frontend",
    patterns: [re("(?:tanstack|react)[\\s-]*query")],
  },
  tanstackrouter: {
    label: "TanStack Router",
    category: "Frontend",
    patterns: [re("tanstack[\\s-]*router")],
  },
  reactrouter: { label: "React Router", category: "Frontend", patterns: [re("react[\\s-]*router")] },
  reactnative: { label: "React Native", category: "Frontend", patterns: [re("react[\\s-]*native")] },
  vue: { label: "Vue", category: "Frontend", patterns: [re("vue(?:\\s?\\.?\\s?js)?")] },
  angular: { label: "Angular", category: "Frontend", patterns: [re("angular(?:\\s?js)?")] },
  svelte: { label: "Svelte", category: "Frontend", patterns: [re("svelte(?:kit)?")] },
  framermotion: {
    label: "Framer Motion",
    category: "Animation",
    patterns: [re("framer(?:[\\s-]*motion)?|motion\\.dev")],
  },
  reactspring: { label: "React Spring", category: "Animation", patterns: [re("react[\\s-]*spring")] },
  gsap: { label: "GSAP", category: "Animation", patterns: [re("gsap|greensock")] },
  cssanimation: {
    label: "CSS Animation",
    category: "Animation",
    patterns: [re("css[\\s-]*animations?|keyframes")],
  },
  lottie: { label: "Lottie", category: "Animation", patterns: [re("lottie")] },
  threejs: {
    label: "Three.js",
    category: "Animation",
    patterns: [re("three\\s?\\.?\\s?js|threejs|webgl|react[\\s-]*three[\\s-]*fiber|r3f")],
  },
  nodejs: { label: "Node.js", category: "Backend", patterns: [re("node(?:\\s?\\.?\\s?js)?")] },
  express: { label: "Express", category: "Backend", patterns: [re("express\\s?\\.?\\s?js|expressjs")] },
  php: { label: "PHP", category: "Backend", patterns: [re("php")] },
  laravel: { label: "Laravel", category: "Backend", patterns: [re("laravel")] },
  python: { label: "Python", category: "Backend", patterns: [re("python|django|flask")] },
  graphql: { label: "GraphQL", category: "Backend", patterns: [re("graphql|apollo")] },
  prisma: { label: "Prisma", category: "Database", patterns: [re("prisma")] },
  supabase: { label: "Supabase", category: "Database", patterns: [re("supabase")] },
  firebase: { label: "Firebase", category: "Database", patterns: [re("firebase|firestore")] },
  realtimedb: {
    label: "Realtime Database",
    category: "Database",
    patterns: [re("real[\\s-]?time[\\s-]*(?:db|database)")],
  },
  mongodb: { label: "MongoDB", category: "Database", patterns: [re("mongo(?:\\s?db)?|mongoose")] },
  postgres: { label: "PostgreSQL", category: "Database", patterns: [re("postgres(?:ql)?|psql")] },
  mysql: { label: "MySQL", category: "Database", patterns: [re("mysql|sql")] },
  git: { label: "Git", category: "Tools", patterns: [re("git(?!\\s?hub)")] },
  figma: { label: "Figma", category: "Tools", patterns: [re("figma")] },
  webpack: { label: "Webpack", category: "Tools", patterns: [re("webpack|vite")] },
  docker: { label: "Docker", category: "Tools", patterns: [re("docker")] },
  wordpress: { label: "WordPress", category: "Other", patterns: [re("wordpress|wp")] },
};

/** Words that point at a skill category. */
export const CATEGORY_SYNONYMS: Record<SkillCategory, string[]> = {
  Frontend: ["frontend", "front end", "front-end", "client side", "ui development"],
  Backend: ["backend", "back end", "back-end", "server side", "server"],
  Database: ["database", "databases", "db", "data storage"],
  Styling: ["styling", "style", "styles", "css frameworks"],
  Animation: [
    "animation",
    "animations",
    "animated",
    "animate",
    "animating",
    "motion",
    "motion design",
    "micro interactions",
    "microinteractions",
    "interactive",
    "interactions",
  ],
  Tools: ["tools", "tooling", "devtools", "dev tools"],
  Other: [],
};

/**
 * Weighted phrases per intent. Each phrase found in the message adds its
 * weight; entity signals are added in intentDetector. A single generic word
 * ("work", "show me") is deliberately low-weight so it can't decide alone.
 */
export const INTENT_LEXICON: Record<Exclude<Intent, "faq" | "unknown">, [string, number][]> = {
  greeting: [
    ["hi", 2], ["hello", 2], ["hey", 2], ["hiya", 2], ["howdy", 2], ["yo", 1.5],
    ["good morning", 2.5], ["good afternoon", 2.5], ["good evening", 2.5],
    ["namaste", 2.5], ["greetings", 2], ["sup", 1.5], ["whats up", 1.5],
    ["thanks", 2], ["thank you", 2.5], ["cheers", 1.5], ["bye", 2], ["goodbye", 2.5],
  ],
  about: [
    ["who is", 2], ["who is anjit", 3], ["about anjit", 3], ["about him", 2.5],
    ["about yourself", 3], ["introduce", 2], ["introduction", 2], ["background", 2],
    ["bio", 2], ["biography", 2], ["tell me about", 1], ["where is he from", 3],
    ["where are you from", 3], ["where is he based", 3], ["based", 1.5], ["location", 2],
    ["live", 1], ["how many years", 2], ["years of experience", 2.5],
    ["how long", 1.5], ["anjit", 0.5],
  ],
  experience: [
    ["experience", 1.5], ["your experience", 1.5], ["his experience", 1.5],
    ["work experience", 3], ["professional experience", 3], ["work history", 3],
    ["employment", 3], ["career", 2.5], ["companies", 2.5], ["company", 2],
    ["worked at", 3], ["work at", 2.5], ["where has he worked", 3.5],
    ["where have you worked", 3.5], ["where does he work", 3], ["where do you work", 3],
    ["job", 1.5], ["jobs", 1.5], ["position", 1.5], ["employer", 3], ["employers", 3],
    ["current job", 3], ["currently working", 2.5], ["responsibilities", 2],
  ],
  projects: [
    ["projects", 3], ["project", 2], ["portfolio", 2], ["work", 0.75], ["built", 1.5],
    ["build", 1], ["made", 1], ["created", 1], ["apps", 1.5], ["websites", 1.5],
    ["sites", 1], ["case studies", 2.5], ["examples", 1.5], ["show me", 0.5],
    ["what have you built", 3], ["what has he built", 3], ["all projects", 3],
    ["which ones", 2], ["which of them", 2], ["any of them", 1.5],
  ],
  project_details: [
    ["tell me more", 1.5], ["more about", 1.5], ["details", 2], ["detail", 2],
    ["contribution", 2], ["contributions", 2], ["contribute", 2], ["role in", 2],
    ["what did you do", 2], ["what did he do", 2], ["the first one", 1], ["the second one", 1],
    ["the last one", 1], ["that one", 1], ["this one", 1], ["that project", 1.5],
    ["this project", 1.5], ["live site", 1.5], ["link", 1], ["url", 1], ["visit", 1],
  ],
  skills: [
    ["skills", 3], ["skill", 3], ["skillset", 3], ["skill set", 3], ["tech stack", 3],
    ["stack", 2], ["technologies", 2.5], ["technology", 2], ["tech", 1.5], ["tools", 2],
    ["languages", 2], ["frameworks", 2.5], ["libraries", 2], ["what do you know", 2],
    ["expertise", 2], ["good at", 2], ["strengths", 2], ["proficient", 1.5],
  ],
  technology_experience: [
    ["worked with", 2], ["work with", 1.5], ["experience with", 2.5], ["experience in", 2],
    ["experienced", 1.5], ["familiar", 2], ["know", 1], ["use", 1], ["used", 1],
    ["using", 1], ["have you used", 2.5], ["does he use", 2], ["do you use", 2],
    ["can you", 1], ["can he", 1],
  ],
  contact: [
    ["contact", 3], ["email", 3], ["e-mail", 3], ["mail", 2], ["reach", 2.5],
    ["get in touch", 3], ["touch", 1.5], ["linkedin", 3], ["github", 3], ["git hub", 3],
    ["cv", 3], ["resume", 3], ["social", 2], ["socials", 2], ["instagram", 3],
    ["dribbble", 3], ["phone", 2], ["message him", 2], ["connect", 1.5], ["website", 1],
  ],
  availability: [
    ["available", 3], ["availability", 3], ["freelance", 3], ["freelancing", 3],
    ["freelancer", 3], ["hire", 2.5], ["hiring", 2], ["open to", 2.5], ["full time", 2],
    ["full-time", 2], ["part time", 2], ["part-time", 2], ["contract", 1.5],
    ["remote", 1.5], ["opportunities", 2], ["looking for work", 3], ["relocate", 2],
    ["new role", 2],
  ],
  help: [
    ["help", 3], ["what can you do", 4], ["what can i ask", 4], ["options", 2],
    ["menu", 2], ["how does this work", 3], ["who are you", 3], ["what are you", 3],
    ["commands", 2], ["what should i ask", 4],
  ],
};

/** Terms that, after a project was discussed, mean "about that project". */
export const PROJECT_ASPECTS: Record<"technologies" | "contribution" | "links", string[]> = {
  technologies: [
    "technologies", "technology", "tech", "stack", "tech stack", "tools", "built with",
    "languages", "frameworks", "libraries", "what did you use", "what was used",
  ],
  contribution: [
    "contribution", "contributions", "contribute", "contributed", "role", "your part",
    "his part", "what did you do", "what did he do", "responsible", "responsibilities",
  ],
  links: ["link", "url", "live", "live site", "website", "visit", "demo", "see it"],
};

/**
 * "it", "there", "this project"… Bare "that"/"this" are excluded because they
 * are usually conjunctions ("projects that use React"), and "is there / are
 * there" is an existence question, not a reference.
 */
export const REFERENCE_PATTERN =
  /(?<![a-z0-9])(?:it|its|(?<!(?:is|are|was|were)\s)there|this one|that one|(?:this|that|the) (?:project|site|app|website))(?![a-z0-9])/;

export const ORDINALS: [RegExp, number][] = [
  [/(?<![a-z0-9])(?:first|1st)(?![a-z0-9])/, 1],
  [/(?<![a-z0-9])(?:second|2nd)(?![a-z0-9])/, 2],
  [/(?<![a-z0-9])(?:third|3rd)(?![a-z0-9])/, 3],
  [/(?<![a-z0-9])(?:fourth|4th)(?![a-z0-9])/, 4],
  [/(?<![a-z0-9])(?:fifth|5th)(?![a-z0-9])/, 5],
  [/(?<![a-z0-9])(?:last|final)(?![a-z0-9])(?!\s+(?:year|time|job|role|month))/, -1],
  [/(?:#|number\s|no\s|project\s)([1-9][0-9]?)(?![a-z0-9])/, 0], // 0 = read the captured number
];
