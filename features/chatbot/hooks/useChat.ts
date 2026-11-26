import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChatContext,
  summarizeForHistory,
  type ChatContextState,
  type HistoryItem,
} from "../engine/conversationManager";
import { buildEngineIndex } from "../engine/indexes";
import type { ChatMessage, KnowledgeBase } from "../engine/types";

// v2: AI responses (sources/mode) and server-managed context.
const STORAGE_KEY = "anjit-portfolio-chat:v2";
const MAX_STORED_MESSAGES = 60;
const MAX_INPUT = 500;
const REQUEST_TIMEOUT_MS = 35_000;

type Stored = { messages: ChatMessage[]; context: ChatContextState; sessionId?: string };

type ApiSuccess = {
  reply: {
    blocks: Extract<ChatMessage, { role: "assistant" }>["blocks"];
    suggestions: string[];
    intent: Extract<ChatMessage, { role: "assistant" }>["intent"];
    sources: NonNullable<Extract<ChatMessage, { role: "assistant" }>["sources"]>;
    basis: Extract<ChatMessage, { role: "assistant" }>["basis"];
    mode: "ai" | "fallback";
  };
  context: ChatContextState;
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function isMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.createdAt !== "number") return false;
  if (r.role === "user") return typeof r.text === "string";
  if (r.role === "error") return typeof r.text === "string" && typeof r.retryText === "string";
  return r.role === "assistant" && Array.isArray(r.blocks) && Array.isArray(r.suggestions);
}

function load(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const messages = Array.isArray(parsed.messages) ? parsed.messages.filter(isMessage) : [];
    // Context is re-validated by the server on every request.
    const context = parsed.context && typeof parsed.context === "object" ? parsed.context : createChatContext();
    const sessionId = typeof parsed.sessionId === "string" ? parsed.sessionId : undefined;
    return { messages, context: context as ChatContextState, sessionId };
  } catch {
    return null;
  }
}

function save(state: Stored) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, messages: state.messages.slice(-MAX_STORED_MESSAGES) })
    );
  } catch {
    // Private mode / quota: the chat still works, it just won't persist.
  }
}

async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* not JSON */
  }
  return res.status === 429
    ? "You're sending messages a bit quickly. Please wait a moment and try again."
    : "Something went wrong on our side. Please try again.";
}

/**
 * Conversation state for the portfolio assistant. Each message goes to
 * POST /api/chat (Gemini + portfolio data, with a rule-based fallback on the
 * server). History and context live in this browser's localStorage; the
 * server also logs each message under a random per-conversation sessionId.
 */
export function useChat(knowledgeBase: KnowledgeBase) {
  const index = useMemo(() => buildEngineIndex(knowledgeBase), [knowledgeBase]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContextState>(createChatContext);
  const [sessionId, setSessionId] = useState<string>(newId);
  const [isTyping, setIsTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Refs so `send` always sees the latest state without re-creating callbacks.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const contextRef = useRef(context);
  contextRef.current = context;
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = load();
    if (stored) {
      setMessages(stored.messages);
      setContext(stored.context);
      if (stored.sessionId) setSessionId(stored.sessionId);
    }
    setHydrated(true);
    return () => inFlight.current?.abort();
  }, []);

  useEffect(() => {
    if (hydrated) save({ messages, context, sessionId });
  }, [messages, context, sessionId, hydrated]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT);
      if (!text || inFlight.current) return;

      const history: HistoryItem[] = messagesRef.current.flatMap((m): HistoryItem[] =>
        m.role === "user"
          ? [{ role: "user", text: m.text }]
          : m.role === "assistant"
            ? [{ role: "assistant", text: summarizeForHistory(m.blocks, index) }]
            : []
      );

      setMessages((prev) => [...prev, { id: newId(), role: "user", text, createdAt: Date.now() }]);
      setIsTyping(true);

      const controller = new AbortController();
      inFlight.current = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let next: ChatMessage;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Chat-Client": "web" },
          body: JSON.stringify({
            message: text,
            sessionId: sessionRef.current,
            history: history.slice(-16),
            context: contextRef.current,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await errorText(res));
        const body = (await res.json()) as ApiSuccess;
        next = {
          id: newId(),
          role: "assistant",
          blocks: body.reply.blocks,
          suggestions: body.reply.suggestions,
          intent: body.reply.intent,
          sources: body.reply.sources,
          mode: body.reply.mode,
          basis: body.reply.basis,
          createdAt: Date.now(),
        };
        setContext(body.context);
      } catch (err) {
        const aborted = (err as Error).name === "AbortError";
        next = {
          id: newId(),
          role: "error",
          text: aborted
            ? "The assistant took too long to answer."
            : err instanceof TypeError
              ? "Couldn't reach the assistant. Check your connection."
              : (err as Error).message,
          retryText: text,
          createdAt: Date.now(),
        };
      } finally {
        clearTimeout(timeout);
        inFlight.current = null;
      }
      setMessages((prev) => [...prev, next]);
      setIsTyping(false);
    },
    [index]
  );

  /** Remove the failed exchange and send the same question again. */
  const retry = useCallback(
    (errorId: string) => {
      const list = messagesRef.current;
      const i = list.findIndex((m) => m.id === errorId);
      const failed = list[i];
      if (!failed || failed.role !== "error") return;
      const before = list[i - 1]?.role === "user" ? i - 1 : i;
      const trimmed = list.slice(0, before);
      messagesRef.current = trimmed;
      setMessages(trimmed);
      void send(failed.retryText);
    },
    [send]
  );

  /**
   * Soft clear: wipes the conversation from this browser (state and
   * localStorage) and starts a new sessionId. Server-side chat logs are kept.
   */
  const clear = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: clearing the state below is enough.
    }
    setIsTyping(false);
    setMessages([]);
    setContext(createChatContext());
    setSessionId(newId()); // a cleared chat starts a new conversation in the logs
  }, []);

  return { index, messages, isTyping, hydrated, send, retry, clear, maxLength: MAX_INPUT };
}
