import type {
  ArudhaLagnaResult,
  Planet,
  PlanetName,
  ZodiacSign,
} from "../types";
import {
  PLANET_LEADERSHIP_TRAITS,
  PLANET_SIGN_OWNERSHIP,
  PLANET_STRENGTH_KEYWORDS,
  SIGN_NAMES,
} from "../utils/planets";

/** The house numbers that trigger the classical Arudha Lagna exception. */
const EXCEPTION_HOUSES = new Set([1, 7]);

/** Number of signs used to move from an exception house to its tenth. */
const TENTH_FROM_EXCEPTION_OFFSET = 9;

/**
 * Returns the natural ruler of a zodiac sign from static ownership metadata.
 *
 * @param sign - Sign whose natural ruler is required.
 * @throws {Error} When no ruler is configured for the supplied sign.
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
 * Returns the one-based house distance between two sign indices.
 *
 * @param fromIndex - Zero-based index of the starting sign.
 * @param toIndex - Zero-based index of the destination sign.
 */
function getSignDistance(fromIndex: number, toIndex: number): number {
  return ((toIndex - fromIndex + SIGN_NAMES.length) % SIGN_NAMES.length) + 1;
}

/**
 * Returns a one-based house position relative to the ascendant sign.
 *
 * @param ascendantIndex - Zero-based index of the ascendant sign.
 * @param signIndex - Zero-based index of the sign to place in a house.
 */
function getHouseFromAscendant(
  ascendantIndex: number,
  signIndex: number,
): number {
  return ((signIndex - ascendantIndex + SIGN_NAMES.length) % SIGN_NAMES.length) + 1;
}

/**
 * Calculates the Arudha Lagna from the Ascendant and the Ascendant lord.
 *
 * The method counts the one-based distance from the Ascendant sign to its lord,
 * projects the same distance forward from the lord's sign, and applies the
 * classical exception: an Arudha Lagna in the first or seventh house moves to
 * the tenth house from that position.
 *
 * @param chart - Complete list of planetary and chart-point positions.
 * @returns The calculated Arudha Lagna with static Lagna-lord metadata.
 * @throws {Error} When the chart does not include an Ascendant.
 */
export function calculateArudhaLagna(
  chart: readonly Planet[],
): ArudhaLagnaResult {
  const ascendant = chart.find((planet) => planet.name === "Ascendant");

  if (!ascendant) {
    throw new Error("Arudha Lagna calculation requires an Ascendant.");
  }

  const ascendantIndex = SIGN_NAMES.indexOf(ascendant.sign);
  const lagnaLord = getSignLord(ascendant.sign);
  const lagnaLordPlacement = chart.find(
    (planet) => planet.name === lagnaLord,
  );

  if (!lagnaLordPlacement) {
    throw new Error(`Arudha Lagna calculation requires ${lagnaLord}.`);
  }

  const lagnaLordIndex = SIGN_NAMES.indexOf(lagnaLordPlacement.sign);
  const distanceFromAscendant = getSignDistance(ascendantIndex, lagnaLordIndex);
  let arudhaSignIndex =
    (lagnaLordIndex + distanceFromAscendant - 1) % SIGN_NAMES.length;
  let house = getHouseFromAscendant(ascendantIndex, arudhaSignIndex);

  if (EXCEPTION_HOUSES.has(house)) {
    arudhaSignIndex =
      (arudhaSignIndex + TENTH_FROM_EXCEPTION_OFFSET) % SIGN_NAMES.length;
    house = getHouseFromAscendant(ascendantIndex, arudhaSignIndex);
  }

  return {
    sign: SIGN_NAMES[arudhaSignIndex],
    house,
    lagnaLord,
    distance: distanceFromAscendant,
    keywords: PLANET_STRENGTH_KEYWORDS[lagnaLord],
    publicTraits: PLANET_LEADERSHIP_TRAITS[lagnaLord],
  };
}
