import { config } from "../config";

type Provider = "anthropic";

const providerKey = () => config.anthropicApiKey;

const providerModel = () => process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

function chooseProvider(): Provider {
  return "anthropic";
}

export class LLMClient {
  private provider: Provider;
  private model: string;
  private apiKey: string;

  constructor() {
    this.provider = chooseProvider();
    this.model = providerModel();
    this.apiKey = providerKey();
  }

  public get available() {
    return Boolean(this.apiKey);
  }

  public async generate(
    system: string,
    messages: Array<{ role: string; content: string }>,
    maxTokens = 800,
  ) {
    if (!this.available) {
      return null;
    }
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: this.apiKey });
      const prompt = `${system}\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
      const response = await client.completions.create({
        model: this.model,
        prompt,
        max_tokens_to_sample: maxTokens,
      });
      const text = response.completion || "";
      return {
        text: text.trim(),
        provider: this.provider,
        model: this.model,
      };
    } catch (error) {
      return null;
    }
  }

  public async generateJson(
    system: string,
    messages: Array<{ role: string; content: string }>,
    maxTokens = 1200,
  ) {
    const resp = await this.generate(system, messages, maxTokens);
    if (!resp) return null;
    const text = resp.text;
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
}
