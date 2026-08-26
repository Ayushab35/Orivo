import type {
  ArudhaLagnaResult,
  AtmakarakaResult,
  ProfessionAnalysis,
  SoulReportUser,
} from "../types";

/**
 * Builds the LLM prompt for transforming deterministic soul-report analysis
 * into executive-facing language. This module only constructs a prompt and
 * does not invoke an LLM.
 *
 * @param user - Optional user and professional context.
 * @param atmakaraka - Deterministically calculated Atmakaraka data.
 * @param profession - Deterministically calculated profession analysis.
 * @param arudhaLagna - Deterministically calculated public-image data.
 * @returns A prompt requiring one strict JSON response.
 */
export function buildSoulPrompt(
  user: SoulReportUser,
  atmakaraka: AtmakarakaResult,
  profession: ProfessionAnalysis,
  arudhaLagna: ArudhaLagnaResult,
): string {
  const context = JSON.stringify(
    {
      user,
      deterministicAnalysis: {
        atmakaraka,
        profession,
        arudhaLagna,
      },
    },
    null,
    2,
  );

  return `You are an executive advisor writing a private-banking and McKinsey-style profile for a senior professional. Translate the supplied deterministic analysis into concise, commercially useful business language. Be analytical, calm, specific, and discreet. Do not make mystical claims, predictions, or guarantees.

Return STRICT JSON only. Do not include Markdown, prose before or after the JSON, comments, or additional keys.

Return exactly this JSON structure:
{
  "soulPurpose": {
    "corePurpose": "string",
    "keyThemes": ["string"],
    "operatingPrinciples": ["string"]
  },
  "profession": {
    "primaryDirection": "string",
    "topProfessions": ["string"],
    "strengths": ["string"],
    "careerEnvironment": ["string"],
    "leadershipStyle": ["string"],
    "developmentRisks": ["string"]
  },
  "publicImage": {
    "perception": "string",
    "leadershipPresence": "string",
    "stakeholderImpact": "string"
  }
}

Do not use these words or phrases anywhere in the output: horoscope, planet names, houses, nakshatra, zodiac, transits, dasha. Do not name individual celestial bodies, signs, chart positions, or astrological systems. Express all source signals as executive capabilities, operating patterns, professional fit, leadership behaviours, and stakeholder perception.

Use only the supplied deterministic analysis as evidence. Do not invent biographical facts, scores, diagnoses, or unsupported career claims.

Source context:
${context}`;
}
