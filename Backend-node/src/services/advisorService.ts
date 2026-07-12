import { LLMClient } from "./llmClient";

const BRIEF_SYSTEM =
  "You are an executive decision intelligence assistant. Tone: McKinsey + Bloomberg — analytical, calm, objective, never mystical. Translate underlying patterns into business language. Forbidden words: astrology, horoscope, lucky, destiny, zodiac, nakshatra, dasha, yoga, transit, fortune, mystical, spiritual. Keep responses concise.";

function buildContext(user: any) {
  return `User profile — Name: ${user?.name ?? "—"}; Role: ${user?.role ?? "—"}; Business: ${user?.businessName ?? "—"} (${user?.industry ?? "—"}).`;
}

export async function advisorReply(
  user: any,
  history: Array<{ role: string; content: string }>,
  message: string,
) {
  const fallback =
    "Here's how I'd think about this: weigh the decision against your current Expansion phase — leaning forward on commitments that compound, holding back on emotionally-charged ones. If this is reversible and low-stake, move now; if it's irreversible, sleep on it and re-ask in the morning.";
  const client = new LLMClient();
  if (!client.available) {
    return fallback;
  }

  const ctx = buildContext(user);
  const system = `${BRIEF_SYSTEM} ${ctx} Reply in 2-5 short sentences. Avoid bullet points. Always end with a single concrete recommendation.`;
  const messages = history
    .slice(-6)
    .map((msg) => ({ role: msg.role, content: msg.content }));
  messages.push({ role: "user", content: message });

  const resp = await client.generate(system, messages, 600);
  return resp?.text?.trim() || fallback;
}
