import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from './llm';
import { RephraseResult } from './types';

// NOTE: `.length(5)` enforces the "exactly 5" requirement at the schema level (the model
// call fails validation if it returns a different count). If you'd rather fail soft than
// throw on an occasional off-by-one, relax this to `.min(3).max(7)` and slice downstream.
const rephraseSchema = z.object({
  rephrasings: z
    .array(z.string())
    .length(5)
    .describe('Exactly 5 distinct rephrasings of the original question, one sentence each.'),
});

const SYSTEM_PROMPT = `You rewrite a business-astrology question into exactly 5 alternative phrasings.
This helps a downstream planner understand precisely what astrological data the question needs.

Rules:
- Do NOT answer the question.
- Preserve the original intent — do not change what is being asked.
- Vary the angle across the 5 versions where natural: e.g. one focused on career/profession, one on timing, one on public image, one on natural talents/strengths, one on obstacles — only where relevant to the original question.
- Each rephrasing is a single, clear sentence.
- Return exactly 5 items.`;

export class RephraseChain {
  private chain;

  constructor() {
    const model = getChatModel(0.3).withStructuredOutput(rephraseSchema, {
      name: 'rephrase_question',
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '{question}'],
    ]);
    this.chain = prompt.pipe(model);
  }

  async run(question: string): Promise<RephraseResult> {
    return this.chain.invoke({ question });
  }
}
