import type {
  CareerIndicator,
  Planet,
  PlanetName,
  TenthHouseAnalysis,
  ZodiacSign,
} from "../types";
import { getAspectingPlanets } from "./aspects";
import {
  PLANET_CAREER_MEANINGS,
  PLANET_SIGN_OWNERSHIP,
  SIGN_NAMES,
} from "../utils/planets";

/** The fixed house number used for career-house analysis. */
const TENTH_HOUSE = 10;

/**
 * Resolves the natural ruler of a zodiac sign from static ownership metadata.
 *
 * @param sign - Sign whose ruler should be resolved.
 * @returns The natural ruler of the supplied sign.
 * @throws {Error} When no planet owns the supplied sign.
 */
function getSignLord(sign: ZodiacSign): PlanetName {
  const lord = (Object.keys(PLANET_SIGN_OWNERSHIP) as PlanetName[]).find(
    (planet) =>
      (PLANET_SIGN_OWNERSHIP[planet] as readonly string[]).includes(sign),
  );

  if (!lord) {
    throw new Error(`No natural ruler is configured for ${sign}.`);
  }

  return lord;
}

/**
 * Resolves the sign occupying a house from the ascendant sign.
 *
 * @param ascendantSign - Sign occupying the first house.
 * @param house - House number to resolve.
 */
function getSignFromHouse(ascendantSign: ZodiacSign, house: number): ZodiacSign {
  const ascendantIndex = SIGN_NAMES.indexOf(ascendantSign);
  const signIndex = (ascendantIndex + house - 1) % SIGN_NAMES.length;

  return SIGN_NAMES[signIndex];
}

/**
 * Produces static career indicators for unique planet names in input order.
 *
 * @param planets - Planets that contribute career indicators.
 */
function getCareerIndicators(planets: readonly Planet[]): CareerIndicator[] {
  const seen = new Set<PlanetName>();

  return planets.reduce<CareerIndicator[]>((indicators, planet) => {
    if (seen.has(planet.name)) {
      return indicators;
    }

    seen.add(planet.name);
    indicators.push({
      planet: planet.name,
      indicators: PLANET_CAREER_MEANINGS[planet.name],
    });

    return indicators;
  }, []);
}

/**
 * Extracts deterministic tenth-house chart factors.
 *
 * The analysis resolves the tenth-house sign from the Ascendant, its natural
 * ruler, the ruler's chart placement, planets placed in or aspecting the tenth
 * house, and associated static career metadata. It performs no interpretation
 * or language-model generation.
 *
 * @param chart - Complete list of planetary and chart-point positions.
 * @returns Strongly typed tenth-house chart data.
 * @throws {Error} When the chart does not include an Ascendant.
 */
export function analyseTenthHouse(
  chart: readonly Planet[],
): TenthHouseAnalysis {
  const ascendant = chart.find((planet) => planet.name === "Ascendant");

  if (!ascendant) {
    throw new Error("Tenth-house analysis requires an Ascendant.");
  }

  const tenthSign = getSignFromHouse(ascendant.sign, TENTH_HOUSE);
  const tenthLord = getSignLord(tenthSign);
  const tenthLordPlacement = chart.find(
    (planet) => planet.name === tenthLord,
  );
  const planetsInTenth = chart.filter(
    (planet) => planet.house === TENTH_HOUSE,
  );
  const planetsAspectingTenth = getAspectingPlanets(chart, TENTH_HOUSE);
  const indicatorPlanets = [
    ...(tenthLordPlacement ? [tenthLordPlacement] : []),
    ...planetsInTenth,
    ...planetsAspectingTenth,
  ];

  return {
    tenthHouse: TENTH_HOUSE,
    tenthSign,
    tenthLord,
    tenthLordPlacement,
    planetsInTenth,
    planetsAspectingTenth,
    careerIndicators: getCareerIndicators(indicatorPlanets),
  };
}
