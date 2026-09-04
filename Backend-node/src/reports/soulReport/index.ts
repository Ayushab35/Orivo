import { LLMClient } from "../../services/llmClient";
import { calculateArudhaLagna } from "./calculators/arudhaLagna";
import {
  combineAspectMeanings,
  getAspectingPlanets,
} from "./calculators/aspects";
import { calculateAtmakaraka } from "./calculators/atmakaraka";
import { analyseProfession } from "./calculators/profession";
import { analyseTenthHouse } from "./calculators/tenthHouse";
import { buildSoulPrompt } from "./llm/soulPrompt";
import type {
  Planet,
  SoulReportLLMResponse,
  SoulReportUser,
} from "./types";
import {
  PLANET_SIGN_OWNERSHIP,
  SIGN_NAMES,
} from "./utils/planets";

/** System instruction supplied to the existing JSON-capable LLM client. */
const SOUL_REPORT_SYSTEM_PROMPT =
  "You are an executive advisor writing in a private-banking and McKinsey style. Return strict JSON only, with no Markdown or preamble. Do not use horoscope, planet names, houses, nakshatra, zodiac, transits, or dasha in the output.";

/**
 * Verifies the minimum structural requirements for a birth chart.
 *
 * @param chart - Chart positions to validate before calculation.
 */
function isValidChart(chart: readonly Planet[]): boolean {
  const ids = new Set<number>();
  const names = new Set<string>();

  return (
    chart.length > 0 &&
    chart.every((planet) => {
      const validId = Number.isFinite(planet.id) && !ids.has(planet.id);
      const validName =
        planet.name in PLANET_SIGN_OWNERSHIP && !names.has(planet.name);
      const validSign = SIGN_NAMES.includes(planet.sign);
      const validHouse =
        Number.isInteger(planet.house) &&
        planet.house >= 1 &&
        planet.house <= 12;
      const validNormDegree =
        planet.normDegree === undefined ||
        (Number.isFinite(planet.normDegree) &&
          planet.normDegree >= 0 &&
          planet.normDegree < 30);

      ids.add(planet.id);
      names.add(planet.name);

      return validId && validName && validSign && validHouse && validNormDegree;
    })
  );
}

/**
 * Checks whether an LLM response follows the required soul-report structure.
 *
 * @param value - Parsed JSON returned by the LLM client.
 */
function isSoulReportResponse(value: unknown): value is SoulReportLLMResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const report = value as Partial<SoulReportLLMResponse>;

  return Boolean(
    report.soulPurpose &&
      report.profession &&
      report.publicImage &&
      typeof report.soulPurpose.corePurpose === "string" &&
      typeof report.profession.primaryDirection === "string" &&
      typeof report.publicImage.perception === "string",
  );
}

/**
 * Builds a deterministic report-shaped response when the LLM is unavailable or
 * returns invalid JSON.
 *
 * @param profession - Deterministic profession analysis.
 * @param publicTraits - Deterministic public-image traits.
 */
function createFallbackReport(
  profession: ReturnType<typeof analyseProfession>,
  publicTraits: readonly string[],
): SoulReportLLMResponse {
  const professions = profession.topProfessions.map((field) => field.name);
  const primaryDirection = professions[0] ?? "strategic leadership";
  const perception = publicTraits.join(", ") || "measured and professional";

  return {
    soulPurpose: {
      corePurpose: `Apply your capabilities through ${primaryDirection}.`,
      keyThemes: professions,
      operatingPrinciples: profession.strengths,
    },
    profession: {
      primaryDirection,
      topProfessions: professions,
      strengths: profession.strengths,
      careerEnvironment: profession.careerEnvironment,
      leadershipStyle: profession.leadershipStyle,
      developmentRisks: profession.possibleWeaknesses,
    },
    publicImage: {
      perception,
      leadershipPresence: perception,
      stakeholderImpact: "Build trust through consistent execution and clear communication.",
    },
  };
}

/**
 * Generates a soul report from a validated birth chart and user context.
 *
 * The function runs all deterministic chart calculations, creates the LLM
 * prompt, and delegates JSON generation to the existing `LLMClient`. If the
 * client is unavailable, fails, or returns an invalid response, a deterministic
 * fallback with the same JSON structure is returned.
 *
 * @param user - User context included in the prompt.
 * @param chart - Complete birth-chart positions.
 * @returns Parsed LLM JSON or a deterministic fallback report.
 * @throws {Error} When the supplied chart fails structural validation.
 */
export async function generateSoulReport(
  user: SoulReportUser,
  chart: readonly Planet[],
): Promise<SoulReportLLMResponse> {
  if (!isValidChart(chart)) {
    throw new Error("Cannot generate a soul report from an invalid chart.");
  }

  const atmakaraka = calculateAtmakaraka(chart);
  const aspectingPlanets = getAspectingPlanets(chart, 10);
  const aspectMeanings = combineAspectMeanings(aspectingPlanets);
  const aspects = {
    aspectingPlanets,
    meanings: aspectMeanings.meanings,
  };
  const tenthHouse = analyseTenthHouse(chart);
  const profession = analyseProfession(atmakaraka, tenthHouse, aspects);
  const arudhaLagna = calculateArudhaLagna(chart);
  const fallback = createFallbackReport(profession, arudhaLagna.publicTraits);
  const prompt = buildSoulPrompt(user, atmakaraka, profession, arudhaLagna);
  const client = new LLMClient();

  if (!client.available) {
    console.log("LLM client not available, returning fallback soul report for user");
    return fallback;
  }

  try {
    const response = await client.generateJson(
      SOUL_REPORT_SYSTEM_PROMPT,
      [{ role: "user", content: prompt }],
      1500,
    );
    console.log("LLM response for soul report generation:", response);

    return isSoulReportResponse(response) ? response : fallback;
  } catch {
    return fallback;
  }
}
