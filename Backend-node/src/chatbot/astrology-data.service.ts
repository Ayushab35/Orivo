
import {
  ArudhaLagnaResult,
  AstrologyMethods,
  BirthChartData,
  Planet,
} from "./types";

import {
  SIGN_LORDS,
  GRAHA_DRISHTI,
  PLANET_NATURAL_MEANINGS,
  HOUSE_MEANINGS,
  ZODIAC_SIGNS,
  ZodiacSignOrder,
} from "./vedicRules";

/**
 * Deterministic Vedic astrology calculations.
 *
 * Assumptions:
 * 1. BirthChartData contains an ASCENDANT entry.
 * 2. Houses are numbered 1-12.
 * 3. Signs are stored using standard names:
 *    Aries, Taurus, Gemini, ... Pisces.
 * 4. fullDegree is available for Atmakaraka calculation.
 */
export class AstrologyDataService implements AstrologyMethods {
  // ---------------------------------------------------------------------------
  // BASIC HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Find a planet's position in the chart.
   */
  private findPlanet(
    chart: BirthChartData,
    planet: Planet,
  ) {
    return chart.chart.find(
      (position) => position.planet === planet,
    );
  }

  /**
   * Get Ascendant position.
   */
  private getAscendant(chart: BirthChartData) {
    const ascendant = chart.chart.find(
      (position) =>
        position.planet === Planet.ASCENDANT,
    );

    if (!ascendant) {
      throw new Error(
        "Ascendant is required for this calculation.",
      );
    }

    return ascendant;
  }

  /**
   * Convert zodiac sign to number 1-12.
   *
   * Aries     = 1
   * Taurus    = 2
   * ...
   * Pisces    = 12
   */
  private getSignNumber(sign: string): number {
    const signNumber =
      ZodiacSignOrder[
        sign as keyof typeof ZodiacSignOrder
      ];

    if (!signNumber) {
      throw new Error(
        `Invalid zodiac sign: ${sign}`,
      );
    }

    return signNumber;
  }

  /**
   * Convert zodiac number 1-12 back to sign.
   */
  private getSignFromNumber(
    signNumber: number,
  ): string {
    const normalized =
      ((signNumber - 1) % 12 + 12) % 12;

    return ZODIAC_SIGNS[normalized];
  }

  /**
   * Count forward from one zodiac sign to another.
   *
   * Example:
   * Gemini -> Virgo = 4
   *
   * Gemini(3)
   * Cancer(4) = 2
   * Leo(5)    = 3
   * Virgo(6)  = 4
   */
  private countSigns(
    fromSign: string,
    toSign: string,
  ): number {
    const from = this.getSignNumber(fromSign);
    const to = this.getSignNumber(toSign);

    return ((to - from + 12) % 12) + 1;
  }

  /**
   * Get the zodiac sign N houses/signs away.
   *
   * distance = 1 means same sign
   * distance = 2 means next sign
   */
  private getSignByDistance(
    sign: string,
    distance: number,
  ): string {
    const start = this.getSignNumber(sign);

    const result =
      ((start - 1 + distance - 1) % 12) + 1;

    return this.getSignFromNumber(result);
  }

  /**
   * Find the house corresponding to a sign, assuming
   * whole-sign houses.
   *
   * Example:
   * Ascendant = Gemini
   *
   * Gemini = house 1
   * Cancer = house 2
   * ...
   * Pisces = house 10
   * Aries = house 11
   * Taurus = house 12
   */
  private getHouseFromSign(
    ascendantSign: string,
    targetSign: string,
  ): number {
    return this.countSigns(
      ascendantSign,
      targetSign,
    );
  }

  // ---------------------------------------------------------------------------
  // 10TH HOUSE LORD
  // ---------------------------------------------------------------------------

  /**
   * Calculate the lord of the 10th house.
   *
   * Steps:
   *
   * 1. Find Ascendant sign.
   * 2. Determine the 10th house sign.
   * 3. Find the natural lord of that sign.
   *
   * Example:
   *
   * Ascendant = Gemini
   *
   * 1st  Gemini
   * 2nd  Cancer
   * ...
   * 10th Pisces
   *
   * Pisces lord = Jupiter
   *
   * Therefore:
   * 10th house lord = Jupiter
   */
  async getTenthHouseLord(
    chart: BirthChartData,
  ): Promise<Planet> {
    const ascendant =
      this.getAscendant(chart);

    const tenthHouseSign =
      this.getSignFromNumber(
        ((this.getSignNumber(ascendant.sign) - 1 + 9) % 12) + 1,
      );

    const lord =
      SIGN_LORDS[
        tenthHouseSign as keyof typeof SIGN_LORDS
      ];

    if (!lord) {
      throw new Error(
        `Unable to determine lord of ${tenthHouseSign}`,
      );
    }

    return lord as Planet;
  }

  // ---------------------------------------------------------------------------
  // PLANETS ASPECTING 10TH HOUSE
  // ---------------------------------------------------------------------------

  /**
   * Find planets casting Graha Drishti on the 10th house.
   *
   * Classical aspect patterns:
   *
   * Sun      -> 7th
   * Moon     -> 7th
   * Mars     -> 4th, 7th, 8th
   * Mercury  -> 7th
   * Jupiter  -> 5th, 7th, 9th
   * Venus    -> 7th
   * Saturn   -> 3rd, 7th, 10th
   *
   * The helper data also contains Rahu/Ketu rules
   * according to your existing rule set.
   */
  async getPlanetsAspectingTenthHouse(
    chart: BirthChartData,
  ): Promise<Planet[]> {
    const ascendant =
      this.getAscendant(chart);

    const ascendantHouse = 1;

    // Whole-sign house calculation:
    // 10th house is 10 houses from Ascendant.
    const tenthHouse = 10;

    const aspectingPlanets: Planet[] = [];

    for (const position of chart.chart) {
      // Ascendant does not cast Graha Drishti.
      if (
        position.planet === Planet.ASCENDANT
      ) {
        continue;
      }

      const aspectPattern =
        GRAHA_DRISHTI[
          position.planet as keyof typeof GRAHA_DRISHTI
        ];

      if (!aspectPattern) {
        continue;
      }

      /**
       * Calculate distance from planet's house
       * to the 10th house.
       *
       * Example:
       *
       * Planet in 6th house
       * 10th house
       *
       * 6 -> 7 -> 8 -> 9 -> 10
       *
       * = 5th house aspect.
       */
      const distance =
        ((tenthHouse - position.house + 12) % 12) + 1;

      if (aspectPattern.includes(distance)) {
        aspectingPlanets.push(
          position.planet,
        );
      }
    }

    return aspectingPlanets;
  }

  // ---------------------------------------------------------------------------
  // ARUDHA LAGNA
  // ---------------------------------------------------------------------------

  /**
   * Calculate Arudha Lagna (Pada of the 1st house).
   *
   * Classical calculation:
   *
   * 1. Find Ascendant sign.
   * 2. Find lord of Ascendant sign.
   * 3. Find the sign where Ascendant lord is placed.
   * 4. Count the distance from Ascendant to its lord.
   * 5. Count the same distance forward from the lord's sign.
   *
   * Special rule:
   *
   * If the resulting Arudha falls in the same sign as
   * the original Ascendant OR the 7th from Ascendant,
   * move the Arudha 10 signs forward.
   */
  async calculateArudhaLagna(
    chart: BirthChartData,
  ): Promise<ArudhaLagnaResult> {
    const ascendant =
      this.getAscendant(chart);

    const ascendantSign =
      ascendant.sign;

    // -------------------------------------------------------------------------
    // STEP 1:
    // Lord of Ascendant sign
    // -------------------------------------------------------------------------

    const ascendantLord =
      SIGN_LORDS[
        ascendantSign as keyof typeof SIGN_LORDS
      ];

    if (!ascendantLord) {
      throw new Error(
        `Unable to determine Ascendant lord for ${ascendantSign}`,
      );
    }

    // -------------------------------------------------------------------------
    // STEP 2:
    // Find Ascendant lord in the chart
    // -------------------------------------------------------------------------

    const lordPosition =
      this.findPlanet(
        chart,
        ascendantLord as Planet,
      );

    if (!lordPosition) {
      throw new Error(
        `Ascendant lord ${ascendantLord} not found in chart.`,
      );
    }

    // -------------------------------------------------------------------------
    // STEP 3:
    // Count distance from Ascendant sign
    // to Ascendant lord's sign
    // -------------------------------------------------------------------------

    const distance =
      this.countSigns(
        ascendantSign,
        lordPosition.sign,
      );

    // -------------------------------------------------------------------------
    // STEP 4:
    // Count the same distance from lord's sign
    // -------------------------------------------------------------------------

    let arudhaSign =
      this.getSignByDistance(
        lordPosition.sign,
        distance,
      );

    // -------------------------------------------------------------------------
    // STEP 5:
    // Special Arudha rule
    //
    // If Arudha Lagna falls in:
    //   - Ascendant sign
    //   - 7th sign from Ascendant
    //
    // move it 10 signs forward.
    // -------------------------------------------------------------------------

    const seventhFromAscendant =
      this.getSignByDistance(
        ascendantSign,
        7,
      );

    if (
      arudhaSign === ascendantSign ||
      arudhaSign === seventhFromAscendant
    ) {
      arudhaSign =
        this.getSignByDistance(
          arudhaSign,
          10,
        );
    }

    // -------------------------------------------------------------------------
    // STEP 6:
    // Convert Arudha sign to house
    // -------------------------------------------------------------------------

    const arudhaHouse =
      this.getHouseFromSign(
        ascendantSign,
        arudhaSign,
      );

    return {
      house: arudhaHouse,
      sign: arudhaSign,
    };
  }

  // ---------------------------------------------------------------------------
  // ATMAKARAKA
  // ---------------------------------------------------------------------------

  /**
   * Calculate Atmakaraka.
   *
   * Atmakaraka is the planet with the highest
   * degree within its sign.
   *
   * Classical 7-planet calculation:
   *
   * Sun
   * Moon
   * Mars
   * Mercury
   * Jupiter
   * Venus
   * Saturn
   *
   * Rahu/Ketu are excluded here.
   *
   * IMPORTANT:
   * The chart must contain fullDegree.
   */
  async getAtmakaraka(
    chart: BirthChartData,
  ): Promise<Planet> {
    const karakaPlanets: Planet[] = [
      Planet.SUN,
      Planet.MOON,
      Planet.MARS,
      Planet.MERCURY,
      Planet.JUPITER,
      Planet.VENUS,
      Planet.SATURN,
    ];

    const candidates = chart.chart.filter(
      (position) =>
        karakaPlanets.includes(
          position.planet,
        ) &&
        typeof position.fullDegree ===
          "number",
    );

    if (
      candidates.length !==
      karakaPlanets.length
    ) {
      throw new Error(
        "Atmakaraka calculation requires fullDegree for Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn.",
      );
    }

    /**
     * Convert absolute longitude to degree
     * within the current zodiac sign.
     *
     * Example:
     *
     * fullDegree = 72.18
     *
     * 72.18 / 30 = Gemini
     *
     * Degree within Gemini:
     * 72.18 % 30 = 12.18°
     */
    const getDegreeWithinSign = (
      fullDegree: number,
    ): number => {
      return (
        ((fullDegree % 30) + 30) % 30
      );
    };

    let atmakaraka =
      candidates[0];

    let highestDegree =
      getDegreeWithinSign(
        atmakaraka.fullDegree!,
      );

    for (
      let i = 1;
      i < candidates.length;
      i++
    ) {
      const position =
        candidates[i];

      const degree =
        getDegreeWithinSign(
          position.fullDegree!,
        );

      if (
        degree > highestDegree
      ) {
        highestDegree = degree;
        atmakaraka = position;
      }
    }

    return atmakaraka.planet;
  }

  // ---------------------------------------------------------------------------
  // ASPECT MEANING
  // ---------------------------------------------------------------------------

  /**
   * Return the meaning of a planet's influence
   * on a particular house.
   *
   * This combines:
   *
   * 1. Planet's natural meaning
   * 2. Planet's career indications
   * 3. House meaning
   * 4. Career relevance of the house
   *
   * Example:
   *
   * Mars aspecting 10th house
   *
   * Planet:
   * engineering, operations, courage
   *
   * 10th house:
   * career, profession, leadership
   *
   * Result:
   * engineering, operations, leadership, etc.
   */
  async getAspectMeaning(
    planet: Planet,
    house: number,
  ): Promise<string[]> {
    const meanings: string[] = [];

    const planetMeaning =
      PLANET_NATURAL_MEANINGS[
        planet as keyof typeof PLANET_NATURAL_MEANINGS
      ];

    if (planetMeaning) {
      meanings.push(
        ...planetMeaning.keywords,
      );

      meanings.push(
        ...planetMeaning.careerIndications,
      );

      meanings.push(
        ...planetMeaning.leadershipTraits,
      );
    }

    const houseMeaning =
      HOUSE_MEANINGS[
        house as keyof typeof HOUSE_MEANINGS
      ];

    if (houseMeaning) {
      meanings.push(
        ...houseMeaning.keywords,
      );

      meanings.push(
        ...houseMeaning.careerRelevance,
      );

      meanings.push(
        ...houseMeaning.executiveInterpretation,
      );
    }

    // Remove duplicates while preserving order.
    return [
      ...new Set(meanings),
    ];
  }
}

