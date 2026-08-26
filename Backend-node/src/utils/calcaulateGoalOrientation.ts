import type {
  GoalOrientationResult,
  Planet,
  PlanetName,
  ZodiacSign,
} from "../reports/soulReport/types";

const SIGNS: ZodiacSign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const SIGN_LORDS: Record<ZodiacSign, PlanetName> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const EXALTATION: Partial<Record<PlanetName, ZodiacSign>> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
};

const DEBILITATION: Partial<Record<PlanetName, ZodiacSign>> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries",
};

const OWN_SIGNS: Partial<Record<PlanetName, ZodiacSign[]>> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"],
  Saturn: ["Capricorn", "Aquarius"],
};

const FRIENDS: Partial<Record<PlanetName, PlanetName[]>> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};

export function calculateGoalOrientation(
  planets: Planet[],
): GoalOrientationResult {
  const ascendant = planets.find((p) => p.name === "Ascendant");

  if (!ascendant) {
    throw new Error("Ascendant missing");
  }

  const ascSign = ascendant.sign;

  const excluded: PlanetName[] = ["Ascendant", "Rahu", "Ketu"];

  const actualPlanets = planets.filter((p) => !excluded.includes(p.name));

  const breakdown = {
    dignity: 0,
    upperHemisphere: 0,
    upachaya: 0,
    mars: 0,
    saturn: 0,
    sun: 0,
    tenthLord: 0,
    eleventhLord: 0,
    dharmaArtha: 0,
    rajYoga: 0,
  };

  //
  // Dignity
  //

  breakdown.dignity = calculateDignity(actualPlanets);

  //
  // Upper Hemisphere
  //

  const upperCount = actualPlanets.filter(
    (p) => p.house >= 7 && p.house <= 12,
  ).length;

  breakdown.upperHemisphere = Math.round(
    (upperCount / actualPlanets.length) * 10,
  );

  //
  // Upachaya
  //

  const upachayaCount = actualPlanets.filter((p) =>
    [3, 6, 10, 11].includes(p.house),
  ).length;

  breakdown.upachaya = Math.min(15, Math.round(upachayaCount * 2.5));

  //
  // Mars
  //

  const mars = findPlanet(planets, "Mars");

  if (mars) {
    if ([3, 6, 10, 11].includes(mars.house)) breakdown.mars = 10;
    else if ([1, 5, 9].includes(mars.house)) breakdown.mars = 7;
    else breakdown.mars = 3;
  }

  //
  // Saturn
  //

  const saturn = findPlanet(planets, "Saturn");

  if (saturn) {
    if ([3, 6, 10, 11].includes(saturn.house)) breakdown.saturn = 10;
    else if ([1, 5, 9].includes(saturn.house)) breakdown.saturn = 7;
    else breakdown.saturn = 3;
  }

  //
  // Sun
  //

  const sun = findPlanet(planets, "Sun");

  if (sun) {
    if ([1, 10, 11].includes(sun.house)) breakdown.sun = 10;
    else if ([5, 9].includes(sun.house)) breakdown.sun = 7;
    else breakdown.sun = 3;
  }

  //
  // Career
  //

  breakdown.tenthLord = evaluateLordStrength(planets, ascSign, 10, 10);

  breakdown.eleventhLord = evaluateLordStrength(planets, ascSign, 11, 5);

  //
  // Dharma Artha
  //

  breakdown.dharmaArtha = calculateDharmaArtha(planets, ascSign);

  //
  // Raj Yoga
  //

  breakdown.rajYoga = calculateRajYoga(planets, ascSign);

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );

  let category = "Moderately Goal Oriented";

  if (score >= 85) category = "Elite Goal Orientation";
  else if (score >= 70) category = "Highly Goal Oriented";
  else if (score >= 55) category = "Strongly Ambitious";
  else if (score >= 40) category = "Balanced";
  else category = "Internally Motivated";

  const insights: string[] = [];

  if (breakdown.upperHemisphere >= 8) {
    insights.push("Strong focus on public achievement and external impact.");
  }

  if (breakdown.upachaya >= 10) {
    insights.push("Excellent growth potential through effort and persistence.");
  }

  if (breakdown.tenthLord >= 8) {
    insights.push("Career and reputation are likely to be major life themes.");
  }

  if (breakdown.rajYoga > 0) {
    insights.push(
      "Chart contains combinations supportive of success and recognition.",
    );
  }

  return {
    score,
    category,
    breakdown,
    insights,
  };
}

function getHouseSign(ascendantSign: ZodiacSign, house: number): ZodiacSign {
  const ascIndex = SIGNS.indexOf(ascendantSign);

  return SIGNS[(ascIndex + house - 1) % 12];
}

function getHouseLord(ascendantSign: ZodiacSign, house: number): PlanetName {
  const sign = getHouseSign(ascendantSign, house);
  return SIGN_LORDS[sign];
}

function findPlanet(planets: Planet[], name: PlanetName): Planet | undefined {
  return planets.find((p) => p.name === name);
}

function calculateDignity(planets: Planet[]): number {
  let score = 0;

  planets.forEach((planet) => {
    if (
      planet.name === "Ascendant" ||
      planet.name === "Rahu" ||
      planet.name === "Ketu"
    ) {
      return;
    }

    if (EXALTATION[planet.name] === planet.sign) {
      score += 4;
      return;
    }

    if (DEBILITATION[planet.name] === planet.sign) {
      score -= 3;
      return;
    }

    if (OWN_SIGNS[planet.name]?.includes(planet.sign)) {
      score += 3;
      return;
    }

    const signLord = SIGN_LORDS[planet.sign];

    if (FRIENDS[planet.name]?.includes(signLord)) {
      score += 2;
    } else {
      score += 1;
    }
  });

  return Math.max(0, Math.min(score, 25));
}

function evaluateLordStrength(
  planets: Planet[],
  ascSign: ZodiacSign,
  houseNumber: number,
  maxScore: number,
): number {
  const lord = getHouseLord(ascSign, houseNumber);

  const lordPlanet = findPlanet(planets, lord);

  if (!lordPlanet) return 0;

  const h = lordPlanet.house;

  if ([1, 4, 5, 7, 9, 10].includes(h)) return maxScore;

  if ([3, 6, 11].includes(h)) return maxScore - 2;

  if ([8, 12].includes(h)) return Math.floor(maxScore / 3);

  return Math.floor(maxScore / 2);
}

function calculateDharmaArtha(planets: Planet[], ascSign: ZodiacSign) {
  let score = 0;

  const dharma = [1, 5, 9];
  const artha = [2, 6, 10];

  dharma.forEach((house) => {
    const lord = getHouseLord(ascSign, house);

    const lordPlanet = findPlanet(planets, lord);

    if (lordPlanet && artha.includes(lordPlanet.house)) {
      score += 3;
    }
  });

  artha.forEach((house) => {
    const lord = getHouseLord(ascSign, house);

    const lordPlanet = findPlanet(planets, lord);

    if (lordPlanet && dharma.includes(lordPlanet.house)) {
      score += 3;
    }
  });

  return Math.min(score, 10);
}

function calculateRajYoga(planets: Planet[], ascSign: ZodiacSign) {
  const firstLord = getHouseLord(ascSign, 1);

  const fifthLord = getHouseLord(ascSign, 5);

  const ninthLord = getHouseLord(ascSign, 9);

  const tenthLord = getHouseLord(ascSign, 10);

  const p1 = findPlanet(planets, firstLord);
  const p5 = findPlanet(planets, fifthLord);
  const p9 = findPlanet(planets, ninthLord);
  const p10 = findPlanet(planets, tenthLord);

  let score = 0;

  if (p1 && p10 && p1.house === p10.house) score += 2;

  if (p5 && p10 && p5.house === p10.house) score += 2;

  if (p9 && p10 && p9.house === p10.house) score += 2;

  return Math.min(score, 5);
}
