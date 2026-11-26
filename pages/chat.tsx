import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Seo from "components/Seo";
import { supabase } from "utils/supabaseClient";
import ChatApp from "features/chatbot/components/ChatApp";
import type { PortfolioClient } from "features/chatbot/services/client";
import { loadKnowledgeBase } from "features/chatbot/services/knowledgeBaseService";
import type { KnowledgeBase } from "features/chatbot/engine/types";

/** Seconds before Supabase edits show up in the chat (no redeploy needed). */
const REVALIDATE = 300;
/** Retry sooner when projects couldn't be loaded. */
const REVALIDATE_ON_ERROR = 30;

export default function ChatPage({ knowledgeBase }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      {/* A conversational view of content that already lives on indexable
          pages, so it stays out of search results but passes link equity. */}
      <Seo
        title="Ask about Anjit's work - Portfolio assistant - Anjit Pariyar"
        description="Chat with Anjit Pariyar's portfolio assistant to explore his projects, skills, experience and contact details."
        path="/chat"
        noindex
      />
      <ChatApp knowledgeBase={knowledgeBase} />
    </>
  );
}

export const getStaticProps = (async () => {
  const { knowledgeBase, warnings } = await loadKnowledgeBase(
    supabase as unknown as PortfolioClient
  );
  if (warnings.length) console.warn(`[chat] ${warnings.join(" | ")}`);
  const projectsFailed = warnings.some((w) => w.startsWith("projects:"));
  return {
    props: { knowledgeBase },
    revalidate: projectsFailed ? REVALIDATE_ON_ERROR : REVALIDATE,
  };
}) satisfies GetStaticProps<{ knowledgeBase: KnowledgeBase }>;
