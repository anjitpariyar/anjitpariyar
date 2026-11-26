import type { ComponentType } from "react";
import type { ChatBlock, ChatBlockType } from "../engine/types";
import ContactCard from "./blocks/ContactCard";
import ExperienceList from "./blocks/ExperienceList";
import FAQCard from "./blocks/FAQCard";
import ProjectDetail from "./blocks/ProjectDetail";
import ProjectList from "./blocks/ProjectList";
import SkillGrid from "./blocks/SkillGrid";
import TextBlock from "./blocks/TextBlock";

type BlockOf<T extends ChatBlockType> = Extract<ChatBlock, { type: T }>;

/**
 * The closed set of components a response may render. Responses carry data
 * (block type + record ids), never markup, so nothing from the database or
 * the visitor is ever turned into HTML or code.
 */
const REGISTRY: { [T in ChatBlockType]: ComponentType<{ block: BlockOf<T> }> } = {
  text: TextBlock,
  project_list: ProjectList,
  project_detail: ProjectDetail,
  skill_grid: SkillGrid,
  experience_list: ExperienceList,
  contact_card: ContactCard,
  faq_card: FAQCard,
};

export default function BlockRenderer({ block }: { block: ChatBlock }) {
  const Component = REGISTRY[block.type] as ComponentType<{ block: ChatBlock }> | undefined;
  return Component ? <Component block={block} /> : null; // unknown types (old storage) are skipped
}
