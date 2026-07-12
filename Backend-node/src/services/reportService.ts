import { LLMClient } from "./llmClient";
import { AppError } from "../errors/AppError";

const MODULE_SCHEMAS: Record<string, { prompt: string; fallback: any }> = {
  personality: {
    prompt:
      "JSON keys: summary, traits (4 objects with key,label,score 0-100,note), axis (object with introvertExtrovert 0-100, goalOrientation 0-100).",
    fallback: {
      summary:
        "A composed strategist who reads the room before speaking, with a long horizon for decisions.",
      traits: [
        {
          key: "composure",
          label: "Composure under pressure",
          score: 82,
          note: "Steady in high-stakes rooms.",
        },
        {
          key: "analytical",
          label: "Analytical depth",
          score: 78,
          note: "Pattern-spotter.",
        },
        {
          key: "delegation",
          label: "Delegation instinct",
          score: 64,
          note: "Holds onto critical paths longer than ideal.",
        },
        {
          key: "candor",
          label: "Strategic candor",
          score: 71,
          note: "Direct, but reads cost of bluntness.",
        },
      ],
      axis: { introvertExtrovert: 38, goalOrientation: 76 },
    },
  },
  strengths: {
    prompt:
      "JSON keys: strengths (3 objects title,detail), improvements (3 objects title,detail,nextStep).",
    fallback: {
      strengths: [
        {
          title: "Calm in turbulence",
          detail: "You stabilize the room when stakes spike.",
        },
        {
          title: "Long-horizon clarity",
          detail: "You see 3 moves ahead while peers see 1.",
        },
        {
          title: "Quiet conviction",
          detail: "You persuade by composure, not volume.",
        },
      ],
      improvements: [
        {
          title: "Delegation reluctance",
          detail: "You hold critical paths longer than required.",
          nextStep: "Fully hand off one process this quarter.",
        },
        {
          title: "Decision latency on people",
          detail: "Hardest calls slip.",
          nextStep: "14-day decision window on any people issue.",
        },
        {
          title: "Under-communicating wins",
          detail: "You under-narrate progress.",
          nextStep: "Send a 5-line weekly note to the leadership group.",
        },
      ],
    },
  },
  career: {
    prompt:
      "JSON keys: trait (2-4 words), thesis (2 sentences), leveragePoints (3 strings), watchOuts (2 strings).",
    fallback: {
      trait: "Composed Long-Horizon Operator",
      thesis:
        "Your career compounds through patience and calibrated bets — not bursts of activity.",
      leveragePoints: [
        "Anchor role in crises.",
        "Multi-year bets where time is the moat.",
        "3 sharp dissenters as a kitchen cabinet.",
      ],
      watchOuts: ["Resist over-explaining.", "Don't outsource visibility."],
    },
  },
  publicImage: {
    prompt:
      "JSON keys: perceivedAs (3 strings), misreadAs (2 strings), recalibration (2 sentences).",
    fallback: {
      perceivedAs: [
        "Composed and unflappable",
        "Deliberate, never reactive",
        "A quiet authority in the room",
      ],
      misreadAs: [
        "Distant when in fact listening hard",
        "Slow when in fact calibrating",
      ],
      recalibration:
        "Narrate your thinking one beat earlier. Your team will read presence, not absence.",
    },
  },
  financialPatterns: {
    prompt:
      "JSON keys: revenuePatterns (3 strings), expensePatterns (3 strings), watchPoints (3 strings).",
    fallback: {
      revenuePatterns: [
        "You build revenue through trust-based, long-cycle relationships.",
        "Concentration risk shows up around 1-2 marquee accounts.",
        "Pricing conviction is your edge.",
      ],
      expensePatterns: [
        "Under-spending on personal infrastructure costs leverage.",
        "Over-investing in talent before the system can absorb them.",
        "Travel & hospitality compound silently.",
      ],
      watchPoints: [
        "Gap between revenue commitment dates and cash arrival.",
        "Urge to fund someone else's narrative.",
        "Silent recurring spend — the quiet leaks beat the loud ones.",
      ],
    },
  },
};

function buildBlurb(user: any) {
  const birth = user?.birth || {};
  return `Name: ${user?.name ?? "—"}; Role: ${user?.role ?? "—"}; Industry: ${user?.industry ?? "—"}; Business: ${user?.businessName ?? "—"}; Birth: ${birth.date ?? "—"} ${birth.time ?? "—"} at ${birth.placeName ?? "—"}.`;
}

export async function generateReport(moduleKey: string, user: any) {
  const spec = MODULE_SCHEMAS[moduleKey];
  if (!spec) {
    throw new AppError(`Unknown report module ${moduleKey}`, 404);
  }

  const client = new LLMClient();
  if (!client.available) {
    return spec.fallback;
  }

  const blurb = buildBlurb(user);
  const prompt = `${blurb}\n\n${spec.prompt}`;
  const resp = await client.generateJson(
    "You write premium, executive-register insight content for C-suite founders. Tone: discreet private-banking advisor — never mystical, never generic. Return STRICT JSON only — no markdown, no preamble.",
    [{ role: "user", content: prompt }],
    1200,
  );
  return resp ?? spec.fallback;
}
