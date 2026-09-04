import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

/** Providers supported by the application's shared LLM client. */
type Provider = "anthropic" | "openai" | "gemini";

/** A provider-neutral text message accepted by the shared client. */
type LLMMessage = {
  role: string;
  content: string;
};

/** A provider-neutral text result returned by the shared client. */
type LLMTextResponse = {
  text: string;
  provider: Provider;
  model: string;
};

/** Resolves a configured provider name to a supported provider. */
function chooseProvider(): Provider {
  switch (config.llmDefaultProvider) {
    case "openai":
    case "gemini":
    case "anthropic":
      return config.llmDefaultProvider;
    default:
      return "anthropic";
  }
}

/** Returns the API key for the selected provider. */
function getProviderKey(provider: Provider): string {
  switch (provider) {
    case "openai":
      return config.openaiApiKey;
    case "gemini":
      return config.geminiApiKey;
    case "anthropic":
      return config.anthropicApiKey;
  }
}

/** Returns the configured model for the selected provider. */
function getProviderModel(provider: Provider): string {
  if (config.llmModel) {
    return config.llmModel;
  }

  switch (provider) {
    case "openai":
      return config.openaiModel;
    case "gemini":
      return config.geminiModel;
    case "anthropic":
      return config.anthropicModel;
  }
}

/** Formats provider-neutral messages as a single text prompt. */
function formatPrompt(system: string, messages: LLMMessage[]): string {
  return [system, ...messages.map((message) => `${message.role}: ${message.content}`)]
    .filter(Boolean)
    .join("\n\n");
}

/** Extracts generated text from an OpenAI Responses API payload. */
function getOpenAIOutput(response: unknown): string {
  const payload = response as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ type?: string; text?: unknown }>;
    }>;
  };

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && typeof content.text === "string")
      ?.text as string | undefined
  ) ?? "";
}

/**
 * Shared multi-provider client for text and JSON generation.
 *
 * Select a provider with `LLM_DEFAULT_PROVIDER=anthropic`, `openai`, or
 * `gemini`. An optional `LLM_MODEL` overrides provider-specific model values.
 */
export class LLMClient {
  private readonly provider: Provider;
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    this.provider = chooseProvider();
    this.model = getProviderModel(this.provider);
    this.apiKey = getProviderKey(this.provider);
  }

  /** Whether the API key for the selected provider is configured. */
  public get available(): boolean {
    return Boolean(this.apiKey);
  }

  /** Generates text through the selected provider. */
  public async generate(
    system: string,
    messages: LLMMessage[],
    maxTokens = 800,
  ): Promise<LLMTextResponse | null> {
    if (!this.available) {
      console.warn("LLM client unavailable: no API key configured for provider:", this.provider, "model:", this.model, "key", this.apiKey);
      return null;
    }

    try {
      switch (this.provider) {
        case "openai":
          return await this.generateWithOpenAI(system, messages, maxTokens);
        case "gemini":
          return await this.generateWithGemini(system, messages);
        case "anthropic":
          return await this.generateWithAnthropic(system, messages, maxTokens);
      }
    } catch {
      console.warn("Error occurred while generating with provider:", this.provider, "model:", this.model);
      return null;
    }
  }

  /** Generates and parses a JSON response through the selected provider. */
  public async generateJson<T = any>(
    system: string,
    messages: LLMMessage[],
    maxTokens = 1200,
  ): Promise<T | null> {
    const response = await this.generate(system, messages, maxTokens);
    console.log("LLM JSON generation response:", response);
    if (!response) {
      return null;
    }

    try {
      return JSON.parse(response.text) as T;
    } catch {
      const match = response.text.match(/\{[\s\S]*\}/);

      if (!match) {
        return null;
      }

      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
  }

  /** Generates text using the OpenAI Responses API. */
  private async generateWithOpenAI(
    system: string,
    messages: LLMMessage[],
    maxTokens: number,
  ): Promise<LLMTextResponse> {
    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: this.model,
        instructions: system,
        input: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
        max_output_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    return {
      text: getOpenAIOutput(response.data).trim(),
      provider: this.provider,
      model: this.model,
    };
  }

  /** Generates text using the installed Gemini SDK. */
  private async generateWithGemini(
    system: string,
    messages: LLMMessage[],
  ): Promise<LLMTextResponse> {
    console.log("Generating with Gemini model:", this.model, "system prompt:", system, "messages:", messages);
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({
      model: this.model,
      systemInstruction: system,
    });
    const response = await model.generateContent(formatPrompt("", messages));
  
    return {
      text: response.response.text().trim(),
      provider: this.provider,
      model: this.model,
    };
  }

  /** Generates text using the installed Anthropic SDK. */
  private async generateWithAnthropic(
    system: string,
    messages: LLMMessage[],
    maxTokens: number,
  ): Promise<LLMTextResponse> {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });
    const text = response.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");

    return {
      text: text.trim(),
      provider: this.provider,
      model: this.model,
    };
  }
}
