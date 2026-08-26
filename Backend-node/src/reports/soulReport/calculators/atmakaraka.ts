import type { AtmakarakaResult, Planet } from "../types";
import {
  PLANET_CAREER_MEANINGS,
  PLANET_LEADERSHIP_TRAITS,
  PLANET_STRENGTH_KEYWORDS,
} from "../utils/planets";

/**
 * Planet names that are not eligible to become the Atmakaraka.
 */
const EXCLUDED_PLANETS = new Set(["Ascendant", "Rahu", "Ketu"]);

/**
 * Calculates the Atmakaraka from chart positions.
 *
 * The Atmakaraka is the eligible planet with the highest normalized degree in
 * its zodiac sign. Ascendant, Rahu, and Ketu are excluded. The calculation
 * requires each eligible candidate to provide a `normDegree` value.
 *
 * @param planets - Complete set of planetary and chart-point positions.
 * @returns The selected planet together with its chart position and static
 * metadata.
 * @throws {Error} When no eligible planet with a normalized degree is present.
 */
export function calculateAtmakaraka(
  planets: readonly Planet[],
): AtmakarakaResult {
  const eligiblePlanets = planets.filter(
    (planet): planet is Planet & { normDegree: number } =>
      !EXCLUDED_PLANETS.has(planet.name) &&
      typeof planet.normDegree === "number" &&
      Number.isFinite(planet.normDegree),
  );

  if (eligiblePlanets.length === 0) {
    throw new Error(
      "Atmakaraka cannot be calculated without an eligible planet normDegree.",
    );
  }

  const planet = eligiblePlanets.reduce((highest, candidate) =>
    candidate.normDegree > highest.normDegree ? candidate : highest,
  );

  return {
    planet,
    degree: planet.normDegree,
    sign: planet.sign,
    house: planet.house,
    keywords: PLANET_STRENGTH_KEYWORDS[planet.name],
    careerMeaning: PLANET_CAREER_MEANINGS[planet.name],
    leadershipMeaning: PLANET_LEADERSHIP_TRAITS[planet.name],
  };
}
