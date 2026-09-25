import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from './llm';
import { ASTROLOGY_METHOD_CATALOG, AstrologyMethodName, MethodSelectionResult } from './types';

const methodSelectionSchema = z.object({
  methods: z
    .array(
      z.object({
        method: z.nativeEnum(AstrologyMethodName),
        reason: z.string().describe('Why this method is needed to answer the question.'),
      })
    )
    .min(1)
    .describe('The smallest sufficient set of methods needed to answer the question. No duplicate methods.'),
});

function buildCatalogText(): string {
  return Object.entries(ASTROLOGY_METHOD_CATALOG)
    .map(([name, description]) => `- ${name}: ${description}`)
    .join('\n');
}

const SYSTEM_PROMPT = `You are the data-planning step of a business-astrology chatbot.
Given the user's question and 5 rephrasings of it, decide which of the following data-fetching methods are needed to answer it accurately.

Available methods:
${buildCatalogText()}

Guidelines:
- Pick only methods whose data is actually needed — do not over-select.
- Do not miss a method whose data is clearly required to ground the answer.
- Never invent a method name outside the list above.
- Give a short reason for each method you pick.`;

export class MethodSelectorChain {
  private chain;

  constructor() {
    const model = getChatModel(0).withStructuredOutput(methodSelectionSchema, {
      name: 'select_astrology_methods',
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', 'Original question: {question}\n\nRephrasings:\n{rephrasings}'],
    ]);
    this.chain = prompt.pipe(model);
  }

  async run(question: string, rephrasings: string[]): Promise<MethodSelectionResult> {
    const rephrasingsText = rephrasings.map((r, i) => `${i + 1}. ${r}`).join('\n');
    return this.chain.invoke({ question, rephrasings: rephrasingsText });
  }
}
