/**
 * Supabase database types, in the shape `supabase gen types typescript` emits.
 *
 * - portfolio_* tables mirror supabase/migrations/20261125000000_portfolio_chatbot.sql
 * - projects mirrors the live table as observed through the public API
 *   (column nullability inferred from data, since the schema endpoint needs
 *   the service-role key).
 *
 * To regenerate from the live database once the migration is applied:
 *   supabase login
 *   supabase gen types typescript --project-id <project-ref> --schema public \
 *     > features/chatbot/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Database"
  | "Styling"
  | "Animation"
  | "Tools"
  | "Other";

export type ProjectRow = {
  id: number;
  created_at: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  thumbnail_video: string | null;
  link: string | null;
  /** HTML (uses <br/>). Never render as HTML in the chat. */
  description: string | null;
  /** Free text, e.g. "REACTJS REDUX REDUX-SAGA" or "Next.js  GSAP". */
  languages: string | null;
  /** [{ title, thumbnail }] */
  images: Json | null;
  is_pinned: boolean | null;
  is_active: boolean | null;
  // Optional columns (supabase/migrations/20261126000100_projects_optional_columns.sql).
  // Absent until that migration runs, so always treat as possibly undefined.
  contribution?: string | null;
  features?: string[] | null;
  category?: string | null;
  github_url?: string | null;
  updated_at?: string | null;
};

/** Record kinds the assistant can reference (cards, sources, tools). */
export type KnowledgeSourceType = "profile" | "project" | "skill" | "experience" | "faq";

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string;
  professional_title: string | null;
  short_bio: string | null;
  detailed_bio: string | null;
  location: string | null;
  email: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  cv_url: string | null;
  /** [{ label, url }] */
  other_links: Json;
  years_experience: number | null;
  availability_status: string | null;
  additional_information: string | null;
  is_published: boolean;
};

export type SkillRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  description: string | null;
  aliases: string[];
  related_skills: string[];
  proficiency_label: string | null;
  years_experience: number | null;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
};

export type ExperienceRow = Timestamps & {
  id: string;
  company: string;
  position: string;
  employment_type: string | null;
  description: string | null;
  responsibilities: string[];
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  technologies: string[];
  company_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type FaqRow = Timestamps & {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string | null;
  related_project_ids: number[];
  sort_order: number;
  is_published: boolean;
};

export type ChatSuggestionRow = Timestamps & {
  id: string;
  label: string;
  message: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      projects: Table<ProjectRow, "title" | "slug">;
      portfolio_profile: Table<ProfileRow, "full_name">;
      portfolio_skills: Table<SkillRow, "name" | "slug">;
      portfolio_experiences: Table<ExperienceRow, "company" | "position">;
      portfolio_faqs: Table<FaqRow, "question" | "answer">;
      portfolio_chat_suggestions: Table<ChatSuggestionRow, "label" | "message">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
