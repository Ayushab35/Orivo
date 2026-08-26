import type {
  AspectAnalysis,
  AtmakarakaResult,
  Planet,
  PlanetExplanation,
  ProfessionAnalysis,
  ProfessionField,
  TenthHouseAnalysis,
} from "../types";
import {
  PLANET_CAREER_ENVIRONMENTS,
  PLANET_CAREER_MEANINGS,
  PLANET_LEADERSHIP_TRAITS,
  PLANET_MEANINGS,
  PLANET_STRENGTH_KEYWORDS,
  PLANET_WEAKNESS_KEYWORDS,
} from "../utils/planets";

/**
 * Returns unique planets in their original order, keyed by planet name.
 *
 * @param planets - Planet positions to deduplicate.
 */
function getUniquePlanets(planets: readonly Planet[]): Planet[] {
  const seen = new Set<string>();

  return planets.filter((planet) => {
    if (seen.has(planet.name)) {
      return false;
    }

    seen.add(planet.name);
    return true;
  });
}

/**
 * Returns unique string values in first-occurrence order.
 *
 * @param values - String values to deduplicate.
 */
function getUniqueValues(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/**
 * Builds ranked profession fields from the static career metadata of planets.
 *
 * A field gains one deterministic point for every contributing planet that
 * contains it. Ties are resolved alphabetically for stable JSON output.
 *
 * @param planets - Unique planets contributing to career analysis.
 */
function getTopProfessions(planets: readonly Planet[]): ProfessionField[] {
  const fields = new Map<string, string[]>();

  for (const planet of planets) {
    for (const field of PLANET_CAREER_MEANINGS[planet.name]) {
      const contributors = fields.get(field) ?? [];
      contributors.push(planet.name);
      fields.set(field, contributors);
    }
  }

  return [...fields.entries()]
    .map(([name, contributors]) => ({
      name,
      rationale: `Supported by ${contributors.join(", ")}.`,
      score: Math.min(contributors.length * 20, 100),
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 5);
}

/**
 * Builds static explanations for the planets that influence the analysis.
 *
 * @param planets - Unique planets contributing to career analysis.
 */
function getPlanetExplanations(
  planets: readonly Planet[],
): PlanetExplanation[] {
  return planets.map((planet) => ({
    planet: planet.name,
    meaning: PLANET_MEANINGS[planet.name],
    careerFields: PLANET_CAREER_MEANINGS[planet.name],
  }));
}

/**
 * Produces deterministic profession analysis from chart calculations and static
 * planetary metadata. This function performs no LLM calls and makes no
 * probabilistic or user-specific interpretation.
 *
 * @param atmakaraka - Previously calculated Atmakaraka data.
 * @param tenthHouse - Previously calculated tenth-house chart factors.
 * @param aspects - Aspecting planets and their static meanings.
 * @returns A deterministic, strongly typed profession analysis.
 */
export function analyseProfession(
  atmakaraka: AtmakarakaResult,
  tenthHouse: TenthHouseAnalysis,
  aspects: AspectAnalysis,
): ProfessionAnalysis {
  const contributingPlanets = getUniquePlanets([
    atmakaraka.planet,
    ...(tenthHouse.tenthLordPlacement ? [tenthHouse.tenthLordPlacement] : []),
    ...tenthHouse.planetsInTenth,
    ...tenthHouse.planetsAspectingTenth,
    ...aspects.aspectingPlanets,
  ]);

  return {
    atmakaraka,
    tenthHouse,
    aspects,
    combinedEffect: contributingPlanets.map(
      (planet) => `${planet.name}: ${PLANET_MEANINGS[planet.name]}`,
    ),
    planetExplanations: getPlanetExplanations(contributingPlanets),
    topProfessions: getTopProfessions(contributingPlanets),
    strengths: getUniqueValues(
      contributingPlanets.flatMap(
        (planet) => PLANET_STRENGTH_KEYWORDS[planet.name],
      ),
    ),
    possibleWeaknesses: getUniqueValues(
      contributingPlanets.flatMap(
        (planet) => PLANET_WEAKNESS_KEYWORDS[planet.name],
      ),
    ),
    careerEnvironment: getUniqueValues(
      contributingPlanets.flatMap(
        (planet) => PLANET_CAREER_ENVIRONMENTS[planet.name],
      ),
    ),
    leadershipStyle: getUniqueValues(
      contributingPlanets.flatMap(
        (planet) => PLANET_LEADERSHIP_TRAITS[planet.name],
      ),
    ),
  };
}
