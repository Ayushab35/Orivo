import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getChatModel } from './llm';
import { GuardrailResult } from './types';

const guardrailSchema = z.object({
  inScope: z
    .boolean()
    .describe(
      'true only if the question genuinely needs astrology to address a business/career/professional topic. false for pure astrology with no business angle, pure business with no astrology angle, or anything unrelated to both.'
    ),
  reason: z.string().describe('One short sentence explaining the decision, safe to show to the end user.'),
});

const SYSTEM_PROMPT = `You are the scope guardrail for a "Business Astrology" chatbot.
This chatbot ONLY answers questions that sit at the intersection of BOTH:
  (a) astrology (birth-chart concepts: houses, planets, lords, aspects, dashas, yogas, etc.), AND
  (b) business, career, profession, or entrepreneurship.

Mark inScope = true only when astrology is genuinely needed to address a business/career question, e.g.:
- "Is this a good time to start a business based on my chart?"
- "Which career suits me according to my 10th house?"
- "Will my business partnership be profitable per my horoscope?"

Mark inScope = false for:
- Pure astrology with no business/career angle (e.g. "When will I get married?")
- Pure business questions with no astrology angle (e.g. "How do I write a business plan?")
- Anything unrelated to both (weather, coding, general chit-chat, etc.)

Be strict. If genuinely ambiguous, prefer false and explain why.`;

export class GuardrailChain {
  private chain;

  constructor() {
    const model = getChatModel(0).withStructuredOutput(guardrailSchema, {
      name: 'guardrail_decision',
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '{question}'],
    ]);
    this.chain = prompt.pipe(model);
  }

  async run(question: string): Promise<GuardrailResult> {
    return this.chain.invoke({ question });
  }
}
