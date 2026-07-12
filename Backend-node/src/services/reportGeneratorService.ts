import { LLMClient } from "./llmClient";

const DAILY_BRIEF_FALLBACK = {
  description:
    "A day that favours composure over speed. Use the strongest windows for one decision that has been drifting.",
  auspicious: "Negotiations, hiring conversations, board-level clarity.",
  caution:
    "Reactive replies, discretionary commitments, and hard confrontations.",
};

const SOUL_FALLBACK = {
  soulPurpose:
    "You are built to translate long-horizon vision into institutions. Your dharmic pull is toward shaping systems and people that outlast a single cycle — not chasing a single win.",
  purposeThemes: [
    "Institution-building",
    "Long-cycle strategy",
    "Talent stewardship",
  ],
  primaryProfession: "Founder / CEO of a compounding, mission-led firm",
  alternativeProfessions: [
    "Managing Partner of a private-capital firm",
    "Chairperson / Board Anchor",
    "Chief Strategy Officer at scale",
  ],
  avoidProfessions: [
    "Transactional, quarter-to-quarter sales roles",
    "High-volume trading desks",
  ],
  reasoning:
    "Your operating signature is patience under uncertainty and clarity when stakes rise. You compound where others burn out. Roles that reward endurance and framing — rather than reaction speed — return more of you.",
  signals: [
    {
      label: "Compounding orientation",
      value: "High",
      note: "Long feedback loops fit you.",
    },
    {
      label: "Ambiguity tolerance",
      value: "High",
      note: "Comfortable in undefined problems.",
    },
    {
      label: "Service instinct",
      value: "Strong",
      note: "You lead best when there is a mission behind the P&L.",
    },
  ],
};

const INNER_PROFILE_FALLBACK = {
  nature: {
    axis: 38,
    label: "Reserved by default, expressive when it matters",
    detail:
      "You do not fill silence for its own sake. You save your presence for high-stakes rooms.",
  },
  goalOrientation: {
    score: 78,
    label: "Long-horizon operator",
    detail:
      "You optimise for outcomes 3+ years out; short-term wins register but do not drive you.",
  },
  innerPersonality:
    "In private you are precise, self-critical, and slow to commit. You test ideas against yourself before testing them against the room. Your best thinking happens when you're not being watched.",
  strengths: [
    "Composure under pressure",
    "Strategic patience",
    "Reads the room quickly",
    "Talent judgement",
  ],
  weaknesses: [
    "Delegation reluctance",
    "Under-communicates progress",
    "Under-narrates conviction",
  ],
  publicImage:
    "You are read as steady and deliberate — sometimes distant. Stakeholders trust your judgement, but occasionally need more of it out loud.",
  recalibration:
    "Narrate your thinking one beat earlier. Presence is more expensive than absence.",
};

function profileBlurb(user: any, chart: any) {
  const birth = user?.birth || {};
  const chartHint = chart
    ? ` Chart source: ${chart.provider ?? "unknown"}.`
    : "";
  return `Name: ${user?.name ?? "—"}; Role: ${user?.role ?? "—"}; Business: ${user?.businessName ?? "—"} (${user?.industry ?? "—"}); Birth: ${birth.date ?? "—"} ${birth.time ?? "—"} at ${birth.placeName ?? "—"}.${chartHint}`;
}

export async function generateDailyDescription(
  user: any,
  dayColor: any,
  choghadia: any,
  chart: any,
) {
  const client = new LLMClient();
  if (!client.available) {
    return DAILY_BRIEF_FALLBACK;
  }
  const good = (choghadia?.good || [])
    .slice(0, 2)
    .map(
      (slot: any) =>
        `${slot.name} ${slot.start.slice(-5)}-${slot.end.slice(-5)}`,
    )
    .join(", ");
  const avoid = (choghadia?.avoid || [])
    .slice(0, 2)
    .map(
      (slot: any) =>
        `${slot.name} ${slot.start.slice(-5)}-${slot.end.slice(-5)}`,
    )
    .join(", ");
  const prompt = `${profileBlurb(user, chart)}\n\nWearable color of the day: ${dayColor.name} (${dayColor.reason}). Auspicious windows: ${good}. Avoid windows: ${avoid}. Write a 2-3 sentence executive-tone daily description in strict JSON with keys description, auspicious, caution.`;
  const resp = await client.generateJson(
    "You are an executive advisor writing for a C-suite founder. Tone: private-banking + McKinsey. Translate any underlying astrological or numerological signals into calm, objective business language. Forbidden vocabulary: horoscope, zodiac, planet names, dasha, nakshatra, yoga, transit, lucky, mystical, spiritual. Every output must be strict JSON, no markdown, no preamble.",
    [{ role: "user", content: prompt }],
    400,
  );
  if (!resp || !resp.description) {
    return DAILY_BRIEF_FALLBACK;
  }
  return {
    description: resp.description,
    auspicious: resp.auspicious ?? DAILY_BRIEF_FALLBACK.auspicious,
    caution: resp.caution ?? DAILY_BRIEF_FALLBACK.caution,
  };
}

export async function generateSoulReport(user: any, chart: any) {
  const client = new LLMClient();
  if (!client.available) {
    return SOUL_FALLBACK;
  }
  const prompt = `${profileBlurb(user, chart)}\n\nGenerate the 'Soul Purpose & Potential Profession' report. Output must exactly match JSON keys: soulPurpose, purposeThemes, primaryProfession, alternativeProfessions, avoidProfessions, reasoning, signals.`;
  const resp = await client.generateJson(
    "You are an executive advisor writing for a C-suite founder. Tone: private-banking + McKinsey. Translate underlying astrological signals into calm business language. Forbidden vocabulary: horoscope, zodiac, planet names, dasha, nakshatra, yoga, transit, lucky, mystical, spiritual. Every output must be strict JSON.",
    [{ role: "user", content: prompt }],
    1500,
  );
  return resp && resp.soulPurpose ? resp : SOUL_FALLBACK;
}

export async function generateInnerProfile(user: any, chart: any) {
  const client = new LLMClient();
  if (!client.available) {
    return INNER_PROFILE_FALLBACK;
  }
  const prompt = `${profileBlurb(user, chart)}\n\nGenerate the 'Inner Profile' report. Output must exactly match JSON keys: nature, goalOrientation, innerPersonality, strengths, weaknesses, publicImage, recalibration.`;
  const resp = await client.generateJson(
    "You are an executive advisor writing for a C-suite founder. Tone: private-banking + McKinsey. Translate underlying astrological signals into calm business language. Forbidden vocabulary: horoscope, zodiac, planet names, dasha, nakshatra, yoga, transit, lucky, mystical, spiritual. Every output must be strict JSON.",
    [{ role: "user", content: prompt }],
    1500,
  );
  return resp && resp.nature ? resp : INNER_PROFILE_FALLBACK;
}
