import type { ContextUpdate } from "./contextManager";
import type { EngineIndex } from "./indexes";
import type { Detection } from "./intentDetector";
import {
  contributionSentences,
  experiencesByCategory,
  experiencesByTech,
  projectsByCategory,
  projectsByTech,
  relatedProjects,
  skillsByCategory,
  skillsByTech,
  techLabel,
  topicSearch,
} from "./retrieval";
import { normalize } from "./text";
import type {
  BotResponse,
  ChatBlock,
  ContactHighlight,
  ConversationContext,
  Entities,
  Intent,
  Project,
  SkillCategory,
} from "./types";

export type BuildInput = {
  normalized: string;
  entities: Entities;
  detection: Detection;
  context: ConversationContext;
  index: EngineIndex;
};

export type BuildOutput = { response: BotResponse; update: ContextUpdate };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const DEFAULT_SUGGESTIONS = [
  "Show me your projects",
  "What technologies do you work with?",
  "Tell me about your experience",
  "How can I contact you?",
];

const text = (t: string): ChatBlock => ({ type: "text", text: t });

const listJoin = (items: string[], conj = "and") =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} ${conj} ${items[items.length - 1]}`;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const matches = (re: RegExp, s: string) => re.test(s);

function firstName(index: EngineIndex): string {
  return index.kb.profile?.fullName.split(/\s+/)[0] ?? "Anjit";
}

function noInfo(index: EngineIndex, what = "that"): string {
  return `I don't have a confirmed answer for ${what} yet. You can contact ${firstName(index)} directly for more details.`;
}

function defaultSuggestions(index: EngineIndex): string[] {
  const fromDb = index.kb.suggestions.map((s) => s.message);
  return fromDb.length ? fromDb : DEFAULT_SUGGESTIONS;
}

function finalize(
  input: BuildInput,
  intent: Intent,
  blocks: ChatBlock[],
  suggestions: string[],
  update: Omit<ContextUpdate, "intent"> = {}
): BuildOutput {
  const asked = input.normalized;
  const unique = [...new Set(suggestions)]
    .filter((s) => normalize(s) !== asked)
    .slice(0, 4);
  return {
    response: {
      blocks,
      suggestions: unique,
      intent,
      confidence: input.detection.confidence,
    },
    update: { intent, ...update },
  };
}

/** The most common technology across projects, excluding some keys. */
function popularTech(index: EngineIndex, exclude: string[] = []): string | null {
  const counts = new Map<string, number>();
  for (const p of index.kb.projects) {
    for (const t of p.technologies) {
      if (!exclude.includes(t.key)) counts.set(t.key, (counts.get(t.key) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/** When asking about React, mention that Next.js projects exist without claiming them. */
function reactNote(index: EngineIndex, techKeys: string[], shownIds: Set<number>): string | null {
  if (!techKeys.includes("react") || techKeys.includes("nextjs")) return null;
  const next = projectsByTech(index, ["nextjs"]).projects.filter((p) => !shownIds.has(p.id));
  if (!next.length) return null;
  return `There ${next.length === 1 ? "is" : "are"} also ${plural(next.length, "Next.js project")} (Next.js is a React framework). Ask "Show me Next.js projects" to see ${next.length === 1 ? "it" : "them"}.`;
}

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

function greeting(input: BuildInput): BuildOutput {
  const { index, normalized } = input;
  const name = firstName(index);
  if (matches(/(?<![a-z])(thanks|thank you|cheers)(?![a-z])/, normalized)) {
    return finalize(input, "greeting", [text(`You're welcome! Anything else you'd like to know about ${name}'s work?`)], defaultSuggestions(index));
  }
  if (matches(/(?<![a-z])(bye|goodbye)(?![a-z])/, normalized)) {
    return finalize(input, "greeting", [text(`Thanks for stopping by! If you'd like to work with ${name}, the contact details are one question away.`)], ["How can I contact you?"]);
  }
  return finalize(
    input,
    "greeting",
    [text(`Hey! I'm ${name}'s portfolio assistant. I can help you explore his projects, technical skills, professional experience, and background. What would you like to know?`)],
    defaultSuggestions(index)
  );
}

function help(input: BuildInput): BuildOutput {
  const name = firstName(input.index);
  return finalize(
    input,
    "help",
    [
      text(
        `I'm a portfolio assistant for ${name}. I answer from his published portfolio data, so I can tell you about:\n\n` +
          `• His projects — "Show me your projects", "Tell me about ${input.index.kb.projects[0]?.title ?? "a project"}"\n` +
          `• Technologies — "Have you worked with Next.js?", "Show me React projects"\n` +
          `• Skills and experience — "What are your frontend skills?", "Tell me about your experience"\n` +
          `• Getting in touch — "How can I contact you?"\n\n` +
          `I don't make things up: if something isn't in his portfolio data, I'll say so.`
      ),
    ],
    defaultSuggestions(input.index)
  );
}

function about(input: BuildInput): BuildOutput {
  const { index, normalized } = input;
  const profile = index.kb.profile;
  const name = firstName(index);
  const followUps = ["Show me your projects", "What technologies do you work with?", "How can I contact you?"];

  if (!profile) {
    return finalize(input, "about", [text(`I don't have ${name}'s profile details on record yet. I can show you his projects, though.`)], followUps);
  }

  const asksYears = matches(/how many years|years of experience|how long|how experienced/, normalized);
  const asksLocation = matches(/(?<![a-z])(where|based|location|live|from)(?![a-z])/, normalized) && !asksYears;

  if (asksYears) {
    const t =
      profile.yearsExperience !== null
        ? `${name} has ${profile.yearsExperience} years of experience${profile.title ? ` as a ${profile.title}` : ""}.`
        : noInfo(index, "his total years of experience");
    return finalize(input, "about", [text(t)], ["Tell me about your experience", ...followUps]);
  }
  if (asksLocation) {
    const t = profile.location ? `${name} is based in ${profile.location}.` : noInfo(index, "where he's based");
    return finalize(input, "about", [text(t)], followUps);
  }

  const intro = [
    `${profile.fullName}${profile.title ? ` is a ${profile.title}` : ""}${profile.location ? ` based in ${profile.location}` : ""}.`,
    profile.shortBio,
    profile.detailedBio,
    profile.additionalInformation,
  ]
    .filter(Boolean)
    .join("\n\n");
  return finalize(input, "about", [text(intro)], followUps);
}

function experience(input: BuildInput): BuildOutput {
  const { index, entities } = input;
  const name = firstName(index);
  const experiences = index.kb.experiences;
  const specific = entities.companyExperienceIds.length
    ? entities.companyExperienceIds
    : entities.referencedExperienceId
      ? [entities.referencedExperienceId]
      : [];

  if (specific.length) {
    const e = index.experienceById.get(specific[0])!;
    return finalize(
      input,
      "experience",
      [text(`Here's ${name}'s role at ${e.company}:`), { type: "experience_list", experienceIds: specific }],
      ["Show me your projects", "What technologies do you work with?"],
      { results: { type: "experiences", ids: specific } }
    );
  }

  if (!experiences.length) {
    const years = index.kb.profile?.yearsExperience;
    return finalize(
      input,
      "experience",
      [
        text(
          `I don't have ${name}'s employment history on record yet.` +
            (years ? ` His profile does say he has ${years} years of experience.` : "") +
            ` His projects are the best picture of his work — or you can contact him directly.`
        ),
      ],
      ["Show me your projects", "How can I contact you?"]
    );
  }

  const ids = experiences.map((e) => e.id);
  return finalize(
    input,
    "experience",
    [
      text(`Here's ${name}'s professional experience (${plural(ids.length, "role")}):`),
      { type: "experience_list", experienceIds: ids },
    ],
    ["What technologies do you work with?", "Show me your projects", "Tell me more about the first one"],
    { results: { type: "experiences", ids } }
  );
}

const REFINE = /(?<![a-z])(which ones|which of them|of those|of them|those|them|these)(?![a-z])/;

function projects(input: BuildInput): BuildOutput {
  const { index, entities, context, normalized } = input;
  const name = firstName(index);
  const all = index.kb.projects;
  if (!all.length) {
    return finalize(input, "projects", [text(`There are no projects published right now. Please check back soon or contact ${name} directly.`)], ["How can I contact you?"]);
  }

  const refine =
    context.lastResults?.type === "projects" &&
    (matches(REFINE, normalized) || context.lastIntent === "projects")
      ? context.lastResults.ids
      : undefined;

  const listSuggestions = (shown: Project[], excludeTech: string[] = []) => {
    const tech = popularTech(index, excludeTech);
    return [
      tech ? `Which ones use ${techLabel(index, tech)}?` : null,
      shown.length > 1 ? "Tell me more about the first one" : null,
      shown[0] ? `What technologies were used in ${shown[0].title}?` : null,
      "What technologies do you work with?",
    ].filter((s): s is string => !!s);
  };

  // Filter by technology ("React projects", "which ones use Next.js?")
  if (entities.technologies.length) {
    const keys = entities.technologies;
    const labels = listJoin(keys.map((k) => techLabel(index, k)), "or");
    let { projects: found, matchedAll } = projectsByTech(index, keys, refine);
    let widened = false;
    if (!found.length && refine) {
      ({ projects: found, matchedAll } = projectsByTech(index, keys));
      widened = found.length > 0;
    }

    if (!found.length) {
      const skills = skillsByTech(index, keys);
      const blocks: ChatBlock[] = [text(`I couldn't find any projects that list ${labels} in their tech stack.`)];
      if (skills.length) {
        blocks.push(text(`It is listed among ${name}'s skills, though:`), { type: "skill_grid", skillIds: skills.map((s) => s.id) });
      }
      const note = reactNote(index, keys, new Set());
      if (note) blocks.push(text(note));
      return finalize(input, "projects", blocks, ["Show me your projects", "What technologies do you work with?"], { technology: keys[0] });
    }

    const ids = found.map((p) => p.id);
    const intro =
      (widened ? `None of the projects above list ${labels}, but across all of them, ` : "") +
      `${plural(found.length, "project")} ${found.length === 1 ? "lists" : "list"} ${matchedAll ? listJoin(keys.map((k) => techLabel(index, k))) : labels}:`;
    const blocks: ChatBlock[] = [text(widened ? intro : intro.charAt(0).toUpperCase() + intro.slice(1)), { type: "project_list", projectIds: ids }];
    const note = reactNote(index, keys, new Set(ids));
    if (note) blocks.push(text(note));
    return finalize(input, "projects", blocks, listSuggestions(found, keys), {
      technology: keys[0],
      results: { type: "projects", ids },
    });
  }

  // Filter by category ("animation projects")
  if (entities.categories.length) {
    const category = entities.categories[0];
    const found = projectsByCategory(index, category, refine);
    if (!found.length) {
      return finalize(input, "projects", [text(`I couldn't find projects whose listed stack includes ${category.toLowerCase()} technologies.`)], ["Show me your projects"], { category });
    }
    const ids = found.map((p) => p.id);
    return finalize(
      input,
      "projects",
      [text(`${plural(found.length, "project")} use ${category.toLowerCase()} technologies:`), { type: "project_list", projectIds: ids }],
      listSuggestions(found),
      { category, results: { type: "projects", ids } }
    );
  }

  // Topic words ("dashboard projects", "e-commerce work")
  if (entities.topicTerms.length) {
    const hits = topicSearch(index, entities.topicTerms);
    if (hits.projects.length) {
      const ids = hits.projects.map((p) => p.id);
      return finalize(
        input,
        "projects",
        [
          text(`These ${hits.projects.length === 1 ? "project mentions" : "projects mention"} “${listJoin(hits.matchedTerms, "or")}” in their descriptions or screenshots:`),
          { type: "project_list", projectIds: ids },
        ],
        listSuggestions(hits.projects),
        { results: { type: "projects", ids } }
      );
    }
  }

  const ids = all.map((p) => p.id);
  return finalize(
    input,
    "projects",
    [text(`Here ${all.length === 1 ? "is" : "are"} ${plural(all.length, "project")} from ${name}'s portfolio:`), { type: "project_list", projectIds: ids }],
    listSuggestions(all),
    { results: { type: "projects", ids } }
  );
}

function resolveProjectId(input: BuildInput): number | null {
  const { entities, detection, context, normalized } = input;
  if (entities.projectIds.length) return entities.projectIds[0];
  if (entities.referencedProjectId !== null) return entities.referencedProjectId;
  if (detection.projectFollowUp) return context.lastProjectId;
  const continuing = matches(/(?<![a-z])(more|details|continue|go on)(?![a-z])/, normalized);
  if (continuing && context.lastProjectId !== null && context.lastIntent === "project_details") {
    return context.lastProjectId;
  }
  if (context.lastResults?.type === "projects" && context.lastResults.ids.length === 1) {
    return context.lastResults.ids[0];
  }
  return null;
}

function projectDetails(input: BuildInput): BuildOutput {
  const { index, entities, detection } = input;
  const name = firstName(index);

  if (entities.projectIds.length > 1) {
    const ids = entities.projectIds;
    return finalize(
      input,
      "project_details",
      [text(`You mentioned ${plural(ids.length, "project")}. Here they are — ask about either one for details:`), { type: "project_list", projectIds: ids }],
      ids.map((id) => `Tell me about ${index.projectById.get(id)!.title}`),
      { results: { type: "projects", ids } }
    );
  }

  const id = resolveProjectId(input);
  const project = id !== null ? index.projectById.get(id) : undefined;

  if (!project && entities.ambiguousProjectIds.length) {
    const options = entities.ambiguousProjectIds.map((pid) => index.projectById.get(pid)!);
    return finalize(
      input,
      "project_details",
      [text(`Did you mean ${listJoin(options.map((p) => p.title), "or")}?`)],
      options.map((p) => `Tell me about ${p.title}`),
      { results: { type: "projects", ids: options.map((p) => p.id) } }
    );
  }

  if (!project) {
    const options = index.kb.projects.slice(0, 4);
    return finalize(
      input,
      "project_details",
      [
        text(
          options.length
            ? `Which project would you like to know about? For example: ${listJoin(options.map((p) => p.title), "or")}.`
            : `There are no projects published right now.`
        ),
      ],
      options.map((p) => `Tell me about ${p.title}`)
    );
  }

  const focus = detection.focus ?? "overview";
  const blocks: ChatBlock[] = [];
  const related = relatedProjects(index, project);
  const firstTech = project.technologies[0];
  const followUps = [
    focus !== "technologies" ? `What technologies were used in ${project.title}?` : null,
    focus !== "contribution" ? `What was your contribution to ${project.title}?` : null,
    firstTech && related.length ? `Show other ${firstTech.label} projects` : null,
    "Show me all projects",
  ].filter((s): s is string => !!s);

  if (focus === "technologies") {
    if (project.technologies.length) {
      blocks.push(text(`${project.title} lists ${listJoin(project.technologies.map((t) => t.label))} in its stack.`));
    } else if (project.technologiesText) {
      blocks.push(text(`The stack listed for ${project.title} is: ${project.technologiesText}.`));
    } else {
      blocks.push(text(noInfo(index, `the tech stack of ${project.title}`)));
    }
  } else if (focus === "contribution") {
    const sentences = contributionSentences(project);
    blocks.push(
      text(
        sentences.length
          ? `Here's how ${name}'s work on ${project.title} is described:\n\n“${sentences.join(" ")}”`
          : `I don't have a confirmed breakdown of ${name}'s specific contribution to ${project.title}. Here's the project overview — you can ask him directly for details.`
      )
    );
  } else if (focus === "links") {
    blocks.push(text(project.link ? `You can visit ${project.title} here:` : `I don't have a public link for ${project.title}.`));
  } else {
    blocks.push(text(`Here's ${project.title}:`));
  }
  blocks.push({ type: "project_detail", projectId: project.id, focus });

  return finalize(input, "project_details", blocks, followUps, {
    projectId: project.id,
    technology: firstTech?.key ?? null,
  });
}

function skills(input: BuildInput): BuildOutput {
  const { index, entities } = input;
  const name = firstName(index);
  if (entities.technologies.length) return technologyExperience(input, "skills");

  if (entities.categories.length) {
    const category = entities.categories[0];
    const found = skillsByCategory(index, category);
    const catProjects = projectsByCategory(index, category);
    if (!found.length && !catProjects.length) {
      return finalize(input, "skills", [text(`I don't have any ${category.toLowerCase()} skills on record for ${name}.`)], ["What technologies do you work with?"], { category });
    }
    const blocks: ChatBlock[] = [];
    if (found.length) {
      blocks.push(text(`${name}'s ${category.toLowerCase()} skills:`), { type: "skill_grid", skillIds: found.map((s) => s.id) });
    }
    if (catProjects.length) {
      blocks.push(text(`Projects using ${category.toLowerCase()} technologies:`), { type: "project_list", projectIds: catProjects.map((p) => p.id) });
    }
    return finalize(input, "skills", blocks, ["Show me your projects", "What technologies do you work with?"], {
      category,
      results: catProjects.length ? { type: "projects", ids: catProjects.map((p) => p.id) } : { type: "skills", ids: found.map((s) => s.id) },
    });
  }

  if (!index.kb.skills.length) {
    // No skills table content: report technologies that appear in projects —
    // a fact from the projects table, not an assumption.
    const counts = new Map<string, number>();
    index.kb.projects.forEach((p) => p.technologies.forEach((t) => counts.set(t.label, (counts.get(t.label) ?? 0) + 1)));
    const used = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
    return finalize(
      input,
      "skills",
      [
        text(
          used.length
            ? `I don't have a skills list on record yet, but these technologies appear in ${name}'s projects: ${listJoin(used)}.`
            : noInfo(index, `${name}'s skills`)
        ),
      ],
      used[0] ? [`Show me ${used[0]} projects`, "Show me your projects"] : ["Show me your projects"]
    );
  }

  const ids = index.kb.skills.map((s) => s.id);
  const featured = index.kb.skills.filter((s) => s.isFeatured).map((s) => s.name);
  return finalize(
    input,
    "skills",
    [
      text(
        `Here are the skills and technologies ${name} works with` +
          (featured.length ? ` — mainly ${listJoin(featured.slice(0, 4))}` : "") +
          `:`
      ),
      { type: "skill_grid", skillIds: ids },
    ],
    [
      featured[0] ? `Show me your ${featured[0]} projects` : "Show me your projects",
      "Do you have experience with animations?",
      "Tell me about your experience",
    ],
    { results: { type: "skills", ids } }
  );
}

function technologyExperience(input: BuildInput, as: Intent = "technology_experience"): BuildOutput {
  const { index, entities } = input;
  const name = firstName(index);

  if (entities.technologies.length) {
    const keys = entities.technologies;
    const labels = listJoin(keys.map((k) => techLabel(index, k)), "or");
    const sk = skillsByTech(index, keys);
    const { projects: pr } = projectsByTech(index, keys);
    const ex = experiencesByTech(index, keys);

    if (!sk.length && !pr.length && !ex.length) {
      const blocks: ChatBlock[] = [
        text(`I don't have any record of ${name} working with ${labels} in his portfolio data. That doesn't necessarily mean he hasn't — it's just not something I can confirm. You could ask him directly.`),
      ];
      const note = reactNote(index, keys, new Set());
      if (note) blocks.push(text(note));
      return finalize(input, as, blocks, ["What technologies do you work with?", "How can I contact you?"], { technology: keys[0] });
    }

    const evidence: string[] = [];
    if (sk.length) evidence.push("it's listed among his skills");
    if (pr.length) evidence.push(pr.length === 1 ? "it's used in one of his projects" : `it's used in ${pr.length} of his projects`);
    if (ex.length) evidence.push(`he used it at ${listJoin(ex.map((e) => e.company))}`);

    const blocks: ChatBlock[] = [text(`Yes — ${labels}: ${listJoin(evidence)}.`)];
    const proficiency = sk.map((s) => s.proficiencyLabel && `${s.name}: ${s.proficiencyLabel}`).filter(Boolean);
    if (proficiency.length) blocks.push(text(`Listed proficiency — ${proficiency.join(", ")}.`));
    if (sk.length) blocks.push({ type: "skill_grid", skillIds: sk.map((s) => s.id) });
    if (pr.length) blocks.push({ type: "project_list", projectIds: pr.map((p) => p.id) });
    if (ex.length) blocks.push({ type: "experience_list", experienceIds: ex.map((e) => e.id) });
    const note = reactNote(index, keys, new Set(pr.map((p) => p.id)));
    if (note) blocks.push(text(note));

    const other = popularTech(index, keys);
    return finalize(
      input,
      as,
      blocks,
      [
        pr.length > 1 ? "Tell me more about the first one" : pr[0] ? `Tell me about ${pr[0].title}` : null,
        other ? `What about ${techLabel(index, other)}?` : null,
        "What technologies do you work with?",
      ].filter((s): s is string => !!s),
      {
        technology: keys[0],
        results: pr.length ? { type: "projects", ids: pr.map((p) => p.id) } : ex.length ? { type: "experiences", ids: ex.map((e) => e.id) } : null,
      }
    );
  }

  if (entities.categories.length) {
    const category: SkillCategory = entities.categories[0];
    const sk = skillsByCategory(index, category);
    const pr = projectsByCategory(index, category);
    const ex = experiencesByCategory(index, category);
    if (!sk.length && !pr.length && !ex.length) {
      return finalize(input, as, [text(`I don't have any ${category.toLowerCase()} work on record for ${name}. You could ask him directly.`)], ["What technologies do you work with?", "How can I contact you?"], { category });
    }
    const blocks: ChatBlock[] = [text(`Here's what I have on ${name}'s ${category.toLowerCase()} work:`)];
    const described = sk.filter((s) => s.description);
    if (described.length) blocks.push(text(described.map((s) => s.description).join("\n\n")));
    if (sk.length) blocks.push({ type: "skill_grid", skillIds: sk.map((s) => s.id) });
    if (pr.length) {
      const techs = [...new Set(pr.flatMap((p) => p.technologies.filter((t) => index.tech.get(t.key)?.category === category).map((t) => t.label)))];
      blocks.push(text(`${plural(pr.length, "project")} ${pr.length === 1 ? "uses" : "use"} ${listJoin(techs)}:`), { type: "project_list", projectIds: pr.map((p) => p.id) });
    }
    if (ex.length) blocks.push({ type: "experience_list", experienceIds: ex.map((e) => e.id) });
    return finalize(input, as, blocks, ["Tell me more about the first one", "What technologies do you work with?", "Show me your projects"], {
      category,
      results: pr.length ? { type: "projects", ids: pr.map((p) => p.id) } : null,
    });
  }

  return topicOrUnknown(input);
}

function highlightFor(normalized: string): ContactHighlight | null {
  if (/(?<![a-z])(cv|resume)(?![a-z])/.test(normalized)) return "cv";
  if (/git\s?hub/.test(normalized)) return "github";
  if (/linkedin/.test(normalized)) return "linkedin";
  if (/(?<![a-z])(e-?mail|mail)(?![a-z])/.test(normalized)) return "email";
  if (/(?<![a-z])(website|portfolio site)(?![a-z])/.test(normalized)) return "website";
  return null;
}

function contact(input: BuildInput): BuildOutput {
  const { index, normalized } = input;
  const name = firstName(index);
  const profile = index.kb.profile;
  const highlight = highlightFor(normalized);
  const missing: Record<ContactHighlight, boolean> = {
    cv: !profile?.cvUrl,
    github: !profile?.githubUrl,
    linkedin: !profile?.linkedinUrl,
    email: !profile?.email,
    website: !profile?.website,
  };
  const label: Record<ContactHighlight, string> = {
    cv: "a CV link",
    github: "a GitHub link",
    linkedin: "a LinkedIn link",
    email: "an email address",
    website: "a website link",
  };

  let intro = `Here's how you can reach ${name}:`;
  if (highlight && missing[highlight]) {
    intro = `I don't have ${label[highlight]} on record for ${name} yet. You can reach him through the options below${highlight === "cv" ? " and ask for one" : ""}:`;
  } else if (highlight === "github") {
    intro = `Here's ${name}'s GitHub, along with his other contact options:`;
  } else if (highlight === "cv") {
    intro = `Here's ${name}'s CV, along with his contact options:`;
  }

  return finalize(
    input,
    "contact",
    [text(intro), { type: "contact_card", highlight }],
    [`Is ${name} available for work?`, "Show me your projects"]
  );
}

function availability(input: BuildInput): BuildOutput {
  const { index } = input;
  const name = firstName(index);
  const status = index.kb.profile?.availability;
  return finalize(
    input,
    "availability",
    [
      text(status ? status : `I don't have confirmed availability information for ${name}. The best way to ask is to contact him directly:`),
      { type: "contact_card", highlight: null },
    ],
    ["Show me your projects", "What technologies do you work with?"]
  );
}

function faq(input: BuildInput): BuildOutput {
  const { index, detection } = input;
  const best = detection.faqMatches[0];
  if (!best) return topicOrUnknown(input);
  const blocks: ChatBlock[] = [{ type: "faq_card", faqIds: [best.faq.id] }];
  if (best.faq.relatedProjectIds.length) {
    blocks.push({ type: "project_list", projectIds: best.faq.relatedProjectIds });
  }
  const others = detection.faqMatches.slice(1, 3).map((m) => m.faq.question);
  return finalize(input, "faq", blocks, [...others, ...defaultSuggestions(index)], {
    results: best.faq.relatedProjectIds.length ? { type: "projects", ids: best.faq.relatedProjectIds } : null,
  });
}

function topicOrUnknown(input: BuildInput): BuildOutput {
  const { index, entities } = input;
  const name = firstName(index);
  const hits = topicSearch(index, entities.topicTerms);

  if (hits.projects.length || hits.experiences.length) {
    const blocks: ChatBlock[] = [text(`I found “${listJoin(hits.matchedTerms, "or")}” mentioned in ${name}'s portfolio:`)];
    if (hits.projects.length) blocks.push({ type: "project_list", projectIds: hits.projects.map((p) => p.id) });
    if (hits.experiences.length) blocks.push({ type: "experience_list", experienceIds: hits.experiences.map((e) => e.id) });
    return finalize(input, "projects", blocks, ["Tell me more about the first one", "Show me all projects"], {
      results: hits.projects.length ? { type: "projects", ids: hits.projects.map((p) => p.id) } : null,
    });
  }

  return finalize(
    input,
    "unknown",
    [
      text(
        `I don't have a confirmed answer for that. I can only answer from ${name}'s portfolio — his projects, skills, experience and contact details. You can contact ${name} directly for anything else.`
      ),
    ],
    defaultSuggestions(index)
  );
}

// ---------------------------------------------------------------------------

const HANDLERS: Record<Intent, (input: BuildInput) => BuildOutput> = {
  greeting,
  help,
  about,
  experience,
  projects,
  project_details: projectDetails,
  skills,
  technology_experience: (input) => technologyExperience(input),
  contact,
  availability,
  faq,
  unknown: topicOrUnknown,
};

const ALTERNATIVE_PROMPTS: Partial<Record<Intent, string>> = {
  experience: "Tell me about your work experience",
  projects: "Show me your projects",
  skills: "What technologies do you work with?",
  contact: "How can I contact you?",
  about: "Who is Anjit?",
  availability: "Are you available for work?",
};

export function buildResponse(input: BuildInput): BuildOutput {
  const out = HANDLERS[input.detection.intent](input);
  // Close call between two intents: offer the other reading as a chip.
  const alt = input.detection.alternative;
  const altPrompt = alt && alt !== out.response.intent ? ALTERNATIVE_PROMPTS[alt] : undefined;
  if (altPrompt && !out.response.suggestions.includes(altPrompt)) {
    out.response.suggestions = [altPrompt, ...out.response.suggestions].slice(0, 4);
  }
  return out;
}
