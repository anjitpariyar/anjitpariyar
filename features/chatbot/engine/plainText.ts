import type { EngineIndex } from "./indexes";
import type { ChatBlock } from "./types";

const SITE = "https://www.anjitpariyar.com.np";

/** Plain-text rendering of a response, used by "Copy response". */
export function blocksToPlainText(blocks: ChatBlock[], index: EngineIndex): string {
  const out: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "text":
        out.push(block.text);
        break;
      case "project_list":
        for (const id of block.projectIds) {
          const p = index.projectById.get(id);
          if (!p) continue;
          const tech = p.technologies.map((t) => t.label).join(", ");
          out.push(`• ${p.title}${tech ? ` (${tech})` : ""} — ${SITE}/projects/${p.slug}`);
        }
        break;
      case "project_detail": {
        const p = index.projectById.get(block.projectId);
        if (!p) break;
        out.push(
          [p.title, p.technologies.map((t) => t.label).join(", "), p.description, p.link]
            .filter(Boolean)
            .join("\n")
        );
        break;
      }
      case "skill_grid": {
        const names = block.skillIds.map((id) => index.skillById.get(id)?.name).filter(Boolean);
        if (names.length) out.push(`Skills: ${names.join(", ")}`);
        break;
      }
      case "experience_list":
        for (const id of block.experienceIds) {
          const e = index.experienceById.get(id);
          if (e) out.push(`• ${e.position} at ${e.company}`);
        }
        break;
      case "contact_card": {
        const p = index.kb.profile;
        const lines = [
          p?.email && `Email: ${p.email}`,
          p?.linkedinUrl && `LinkedIn: ${p.linkedinUrl}`,
          p?.githubUrl && `GitHub: ${p.githubUrl}`,
          p?.website && `Website: ${p.website}`,
          p?.cvUrl && `CV: ${p.cvUrl}`,
          ...(p?.otherLinks ?? []).map((l) => `${l.label}: ${l.url}`),
          `Contact form: ${SITE}/contact`,
        ].filter(Boolean);
        out.push(lines.join("\n"));
        break;
      }
      case "faq_card":
        for (const id of block.faqIds) {
          const f = index.faqById.get(id);
          if (f) out.push(`${f.question}\n${f.answer}`);
        }
        break;
    }
  }
  return out.join("\n\n").trim();
}
