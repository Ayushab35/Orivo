import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';

/**
 * Single place every chain gets its chat model from.
 *
 * Swap ChatOpenAI for ChatAnthropic (`@langchain/anthropic`, same `.withStructuredOutput`
 * API) if you'd rather run this on Claude — nothing else in the codebase needs to change.
 *
 * Requires OPENAI_API_KEY to be set (e.g. via a .env file loaded before this module
 * is imported) — see .env.example.
 */
export function getChatModel(temperature = 0, modelName?: string): ChatOpenAI {
  return new ChatOpenAI({
    model: modelName ?? process.env.OPENAI_MODEL_NAME ?? 'gpt-4o-mini',
    temperature,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
