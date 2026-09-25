import { BirthChartData, ChatbotResponse, ChatbotStatus } from './types';
import { GuardrailChain } from './guardrail.chain';
import { RephraseChain } from './rephrase.chain';
import { MethodSelectorChain } from './method-selector.chain';
import { FinalAnswerChain } from './final-answer.chain';
import { MethodExecutorService } from './method-executor.service';
import { AstrologyDataService } from './astrology-data.service';

/**
 * Orchestrates the full business-astrology chatbot pipeline:
 *   guardrail -> rephrase (x5) -> method selection -> data fetch -> final answer.
 *
 * This is the single entry point your existing controller should call.
 */
export class ChatbotService {
  constructor(
    private readonly guardrail: GuardrailChain = new GuardrailChain(),
    private readonly rephraser: RephraseChain = new RephraseChain(),
    private readonly methodSelector: MethodSelectorChain = new MethodSelectorChain(),
    private readonly finalAnswer: FinalAnswerChain = new FinalAnswerChain(),
    private readonly executor: MethodExecutorService = new MethodExecutorService(
      new AstrologyDataService()
    )
  ) {}

  async handleQuery(question: string, chart: BirthChartData): Promise<ChatbotResponse> {
    if (!question?.trim()) {
      return { status: ChatbotStatus.ERROR, answer: 'question is required' };
    }

    try {
      // 1. Guardrail — must be a business + astrology question, or we stop here and
      //    return directly to the application without touching the rest of the pipeline.
      const guardrailResult = await this.guardrail.run(question);
      if (!guardrailResult.inScope) {
        return {
          status: ChatbotStatus.OUT_OF_SCOPE,
          answer:
            'This assistant only answers questions that combine astrology with business or career topics. ' +
            guardrailResult.reason,
        };
      }

      // 2. Rephrase the question 5 ways so downstream steps understand intent clearly.
      const { rephrasings } = await this.rephraser.run(question);
      console.log(rephrasings);
      // 3. Decide which astrology methods are needed to answer it.
      const { methods } = await this.methodSelector.run(question, rephrasings);
      console.log(methods);
      // 4. Execute those methods against the user's birth chart.
      const astrologyData = await this.executor.execute(methods, chart);
      
      // 5. Compose the final, grounded answer.
      const { answer } = await this.finalAnswer.run(question, rephrasings, astrologyData);

      return { status: ChatbotStatus.SUCCESS, answer };
    } catch (error) {
      console.error('[ChatbotService.handleQuery] failed:', error);
      return {
        status: ChatbotStatus.ERROR,
        answer: 'Something went wrong while processing your question. Please try again shortly.',
      };
    }
  }
}

/** Ready-to-use singleton — import this directly into your controller. */
export const chatbotService = new ChatbotService();
