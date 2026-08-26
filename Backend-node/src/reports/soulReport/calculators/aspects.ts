import type { Planet, PlanetName } from "../types";
import {
  PLANET_MEANINGS,
  VEDIC_ASPECT_HOUSES,
} from "../utils/planets";

/**
 * A deterministic, JSON-serializable summary of planets aspecting a house.
 */
export interface AspectMeaningSummary {
  /** Names of planets casting an aspect on the requested house. */
  planets: PlanetName[];
  /** Static meanings associated with the aspecting planets. */
  meanings: string[];
}

/**
 * Converts an integer house value to the inclusive range from 1 through 12.
 *
 * @param house - House number to normalize.
 */
function normalizeHouse(house: number): number {
  return ((house - 1) % 12 + 12) % 12 + 1;
}

/**
 * Returns the houses receiving Graha Drishti from a planet.
 *
 * All supported planets cast a seventh-house aspect. Mars additionally aspects
 * the fourth and eighth houses, Jupiter the fifth and ninth houses, Saturn the
 * third and tenth houses, and Rahu/Ketu the fifth and ninth houses.
 *
 * @param planet - Planet whose aspects should be resolved.
 * @returns Normalized house numbers receiving the planet's aspects.
 */
export function getAspectedHouses(planet: Planet): number[] {
  const aspectDistances = VEDIC_ASPECT_HOUSES[planet.name];

  return aspectDistances.map((distance) =>
    normalizeHouse(planet.house + distance - 1),
  );
}

/**
 * Determines whether a planet casts Graha Drishti on a target house.
 *
 * @param planet - Planet whose aspects should be checked.
 * @param house - Target house number.
 * @returns `true` when the target house receives an aspect from the planet.
 */
export function doesPlanetAspectHouse(planet: Planet, house: number): boolean {
  return getAspectedHouses(planet).includes(normalizeHouse(house));
}

/**
 * Returns all chart planets that cast Graha Drishti on a target house.
 *
 * The output preserves the source chart order so repeated calls with the same
 * chart input always produce the same JSON-serializable array.
 *
 * @param planets - Complete set of chart positions.
 * @param house - Target house number.
 * @returns Planets aspecting the requested house.
 */
export function getAspectingPlanets(
  planets: readonly Planet[],
  house: number,
): Planet[] {
  return planets.filter((planet) => doesPlanetAspectHouse(planet, house));
}

/**
 * Combines static meanings for a group of aspecting planets.
 *
 * This function does not assess whether an aspect is favourable or unfavourable;
 * it only returns the fixed planetary meanings in source order.
 *
 * @param planets - Planets whose static meanings should be combined.
 * @returns A deterministic JSON-serializable summary of names and meanings.
 */
export function combineAspectMeanings(
  planets: readonly Planet[],
): AspectMeaningSummary {
  return {
    planets: planets.map((planet) => planet.name),
    meanings: planets.map((planet) => PLANET_MEANINGS[planet.name]),
  };
}
