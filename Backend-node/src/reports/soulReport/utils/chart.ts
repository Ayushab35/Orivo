import type {
  Planet,
  PlanetName,
  ZodiacSign,
} from "../types";
import {
  PLANET_SIGN_OWNERSHIP,
  SIGN_NAMES,
} from "./planets";

/**
 * Returns the chart entry with the supplied provider-specific identifier.
 *
 * @param planets - Complete list of chart positions.
 * @param id - Provider-specific planet identifier.
 */
export function getPlanet(planets: readonly Planet[], id: number): Planet | undefined {
  return planets.find((planet) => planet.id === id);
}

/**
 * Returns the chart entry with the supplied planet or chart-point name.
 *
 * @param planets - Complete list of chart positions.
 * @param name - Name of the requested planet or chart point.
 */
export function getPlanetByName(
  planets: readonly Planet[],
  name: PlanetName,
): Planet | undefined {
  return planets.find((planet) => planet.name === name);
}

/**
 * Returns the Ascendant entry from a birth chart.
 *
 * @param planets - Complete list of chart positions.
 */
export function getAscendant(planets: readonly Planet[]): Planet | undefined {
  return getPlanetByName(planets, "Ascendant");
}

/**
 * Returns the normalized house number occupied by a planet.
 *
 * @param planet - Chart position to inspect.
 */
export function getHouse(planet: Planet): number {
  return normalizeHouse(planet.house);
}

/**
 * Returns the zodiac sign occupied by a planet.
 *
 * @param planet - Chart position to inspect.
 */
export function getSign(planet: Planet): ZodiacSign {
  return planet.sign;
}

/**
 * Returns the natural ruler of a zodiac sign, if the sign has one.
 *
 * @param sign - Zodiac sign whose ruler is requested.
 */
export function getHouseLord(sign: ZodiacSign): PlanetName | undefined {
  return (Object.keys(PLANET_SIGN_OWNERSHIP) as PlanetName[]).find((planet) =>
    (PLANET_SIGN_OWNERSHIP[planet] as readonly string[]).includes(sign),
  );
}

/**
 * Returns every planet occupying a normalized house number.
 *
 * @param planets - Complete list of chart positions.
 * @param house - Requested house number.
 */
export function getPlanetsInHouse(
  planets: readonly Planet[],
  house: number,
): Planet[] {
  const normalizedHouse = normalizeHouse(house);

  return planets.filter(
    (planet) => normalizeHouse(planet.house) === normalizedHouse,
  );
}

/**
 * Returns every planet occupying the supplied zodiac sign.
 *
 * @param planets - Complete list of chart positions.
 * @param sign - Requested zodiac sign.
 */
export function getPlanetsInSign(
  planets: readonly Planet[],
  sign: ZodiacSign,
): Planet[] {
  return planets.filter((planet) => planet.sign === sign);
}

/**
 * Returns the sign occupying a house when the ascendant sign is known.
 *
 * @param ascendantSign - Zodiac sign rising in the first house.
 * @param house - House number to resolve.
 */
export function getSignFromHouse(
  ascendantSign: ZodiacSign,
  house: number,
): ZodiacSign {
  const ascendantIndex = SIGN_NAMES.indexOf(ascendantSign);
  const signIndex = (ascendantIndex + normalizeHouse(house) - 1) % SIGN_NAMES.length;

  return SIGN_NAMES[signIndex];
}

/**
 * Converts an integer house position to the inclusive range from 1 through 12.
 *
 * @param house - House position to normalize.
 */
export function normalizeHouse(house: number): number {
  if (!Number.isInteger(house)) {
    throw new TypeError("House must be an integer.");
  }

  return ((house - 1) % 12 + 12) % 12 + 1;
}

/**
 * Checks whether chart positions have valid identifiers, names, signs, houses,
 * and optional degree values. The check does not infer or interpret chart data.
 *
 * @param planets - Complete list of chart positions to validate.
 */
export function validateChart(planets: readonly Planet[]): boolean {
  const ids = new Set<number>();
  const names = new Set<PlanetName>();

  return planets.length > 0 && planets.every((planet) => {
    const validId = Number.isFinite(planet.id) && !ids.has(planet.id);
    const validName = planet.name in PLANET_SIGN_OWNERSHIP && !names.has(planet.name);
    const validSign = SIGN_NAMES.includes(planet.sign);
    const validHouse = Number.isInteger(planet.house) && planet.house >= 1 && planet.house <= 12;
    const validFullDegree =
      planet.fullDegree === undefined ||
      (Number.isFinite(planet.fullDegree) && planet.fullDegree >= 0 && planet.fullDegree < 360);
    const validNormDegree =
      planet.normDegree === undefined ||
      (Number.isFinite(planet.normDegree) && planet.normDegree >= 0 && planet.normDegree < 30);

    ids.add(planet.id);
    names.add(planet.name);

    return validId && validName && validSign && validHouse && validFullDegree && validNormDegree;
  });
}
