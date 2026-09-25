import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from './llm';
import { FinalAnswerResult } from './types';

const finalAnswerSchema = z.object({
  answer: z
    .string()
    .describe(
      'The final answer shown to the user. Grounded only in the provided astrology data. Explain the relevant astrological factors briefly, then the business/career implication, then a short practical takeaway.'
    ),
});

const SYSTEM_PROMPT = `You are a professional business-astrology advisor.
Answer the user's question using ONLY the astrological data provided — never invent planets, houses, or positions that are not present in the data.

Structure your answer as:
1. The relevant astrological factors found in the data.
2. What they mean for the person's business/career.
3. A brief, practical takeaway.

Tone: professional, warm, and grounded. Present astrology as guidance, not certainty — avoid fatalistic or absolute claims.`;

export class FinalAnswerChain {
  private chain;

  constructor() {
    const model = getChatModel(0.4).withStructuredOutput(finalAnswerSchema, {
      name: 'compose_final_answer',
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      [
        'human',
        'Original question: {question}\n\nRephrasings considered:\n{rephrasings}\n\nAstrology data (JSON):\n{data}',
      ],
    ]);
    this.chain = prompt.pipe(model);
  }

  async run(
    question: string,
    rephrasings: string[],
    astrologyData: Record<string, unknown>
  ): Promise<FinalAnswerResult> {
    const rephrasingsText = rephrasings.map((r, i) => `${i + 1}. ${r}`).join('\n');
    const dataText = JSON.stringify(astrologyData, null, 2);
    return this.chain.invoke({ question, rephrasings: rephrasingsText, data: dataText });
  }
}
