import { createInitialContext, updateContext } from "./contextManager";
import { extractEntities } from "./entityExtractor";
import { buildEngineIndex, type EngineIndex } from "./indexes";
import { detectIntent } from "./intentDetector";
import { buildResponse } from "./responseBuilder";
import { normalize } from "./text";
import type { BotResponse, ConversationContext, KnowledgeBase } from "./types";

export type EngineTurn = {
  response: BotResponse;
  context: ConversationContext;
};

export type ChatEngine = {
  index: EngineIndex;
  respond: (message: string, context?: ConversationContext) => EngineTurn;
};

const MAX_MESSAGE_LENGTH = 500;

/**
 * Deterministic portfolio assistant: no model, no network. Build once per
 * knowledge base, then call `respond` per message with the current context.
 */
export function createChatEngine(kb: KnowledgeBase): ChatEngine {
  const index = buildEngineIndex(kb);

  const respond = (message: string, context = createInitialContext()): EngineTurn => {
    const normalized = normalize(message.slice(0, MAX_MESSAGE_LENGTH));
    const entities = extractEntities(normalized, index, context);
    const detection = detectIntent(normalized, entities, context, index);
    const { response, update } = buildResponse({ normalized, entities, detection, context, index });
    return { response, context: updateContext(context, update) };
  };

  return { index, respond };
}

export { createInitialContext, restoreContext } from "./contextManager";
export type * from "./types";
