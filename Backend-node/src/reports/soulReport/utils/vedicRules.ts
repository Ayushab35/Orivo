import type { PlanetName, ZodiacSign } from "../types";

/** Planet names used by deterministic Vedic calculations, excluding Ascendant. */
export type VedicPlanet = Exclude<PlanetName, "Ascendant">;

/** Classical planetary rulers of the twelve zodiac signs. */
export type ClassicalPlanet = Exclude<VedicPlanet, "Rahu" | "Ketu">;

/** A one-based Vedic house number. */
export type HouseNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

/** Metadata describing a planet's stable natural indications. */
export interface PlanetNaturalMeaning {
  /** Display name of the planet. */
  readonly name: VedicPlanet;
  /** Concise natural keywords. */
  readonly keywords: readonly string[];
  /** Concise career indications. */
  readonly careerIndications: readonly string[];
  /** Concise leadership traits. */
  readonly leadershipTraits: readonly string[];
  /** Concise personality traits. */
  readonly personalityTraits: readonly string[];
  /** Constructive strength themes. */
  readonly strengthThemes: readonly string[];
  /** Potential challenge themes. */
  readonly challengeThemes: readonly string[];
}

/** Metadata describing the stable meaning of a Vedic house. */
export interface HouseMeaning {
  /** One-based house number. */
  readonly house: HouseNumber;
  /** Traditional house name. */
  readonly name: string;
  /** Concise house keywords. */
  readonly keywords: readonly string[];
  /** Career-specific relevance of the house. */
  readonly careerRelevance: readonly string[];
  /** Concise executive-language interpretation themes. */
  readonly executiveInterpretation: readonly string[];
}

/** Relationship categories in natural planetary friendship rules. */
export interface PlanetFriendship {
  /** Naturally friendly planets. */
  readonly friends: readonly VedicPlanet[];
  /** Naturally hostile planets. */
  readonly enemies: readonly VedicPlanet[];
  /** Naturally neutral planets. */
  readonly neutral: readonly VedicPlanet[];
}

/** The twelve zodiac signs in natural order, beginning with Aries. */
export const ZODIAC_SIGNS = [
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
] as const satisfies readonly ZodiacSign[];

/** Numeric positions of zodiac signs in their natural order. */
export enum ZodiacSignOrder {
  Aries = 1,
  Taurus = 2,
  Gemini = 3,
  Cancer = 4,
  Leo = 5,
  Virgo = 6,
  Libra = 7,
  Scorpio = 8,
  Sagittarius = 9,
  Capricorn = 10,
  Aquarius = 11,
  Pisces = 12,
}

/** Natural ruler of every zodiac sign. */
export const SIGN_LORDS: Readonly<Record<ZodiacSign, ClassicalPlanet>> = {
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

/** Planets used in deterministic Vedic calculations. */
export const VEDIC_PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const satisfies readonly VedicPlanet[];

/** Fixed natural order used when stable planet ordering is required. */
export const PLANET_ORDER: Readonly<Record<VedicPlanet, number>> = {
  Sun: 1,
  Moon: 2,
  Mars: 3,
  Mercury: 4,
  Jupiter: 5,
  Venus: 6,
  Saturn: 7,
  Rahu: 8,
  Ketu: 9,
};

/** Graha Drishti house distances cast by each planet. */
export const GRAHA_DRISHTI: Readonly<Record<VedicPlanet, readonly number[]>> = {
  Sun: [7],
  Moon: [7],
  Mars: [4, 7, 8],
  Mercury: [7],
  Jupiter: [5, 7, 9],
  Venus: [7],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

/** Stable natural meanings for every planet used by the engine. */
export const PLANET_NATURAL_MEANINGS: Readonly<
  Record<VedicPlanet, PlanetNaturalMeaning>
> = {
  Sun: {
    name: "Sun",
    keywords: ["identity", "authority", "vitality", "purpose"],
    careerIndications: ["leadership", "government", "administration", "executive roles"],
    leadershipTraits: ["decisive", "visible", "purpose-led", "authoritative"],
    personalityTraits: ["confident", "self-directed", "principled"],
    strengthThemes: ["clarity", "integrity", "command"],
    challengeThemes: ["ego", "rigidity", "dominance"],
  },
  Moon: {
    name: "Moon",
    keywords: ["mind", "care", "public connection", "responsiveness"],
    careerIndications: ["hospitality", "public service", "caregiving", "community work"],
    leadershipTraits: ["empathetic", "protective", "responsive", "people-centered"],
    personalityTraits: ["intuitive", "adaptable", "nurturing"],
    strengthThemes: ["empathy", "awareness", "adaptability"],
    challengeThemes: ["moodiness", "dependency", "over-sensitivity"],
  },
  Mars: {
    name: "Mars",
    keywords: ["action", "courage", "discipline", "competition"],
    careerIndications: ["engineering", "military", "surgery", "operations"],
    leadershipTraits: ["bold", "action-oriented", "competitive", "courageous"],
    personalityTraits: ["direct", "energetic", "assertive"],
    strengthThemes: ["initiative", "bravery", "persistence"],
    challengeThemes: ["impatience", "anger", "impulsiveness"],
  },
  Mercury: {
    name: "Mercury",
    keywords: ["intellect", "communication", "analysis", "commerce"],
    careerIndications: ["software", "finance", "business", "media", "communication", "technology"],
    leadershipTraits: ["strategic", "articulate", "agile", "collaborative"],
    personalityTraits: ["curious", "versatile", "analytical"],
    strengthThemes: ["reasoning", "adaptability", "communication"],
    challengeThemes: ["overthinking", "inconsistency", "superficiality"],
  },
  Jupiter: {
    name: "Jupiter",
    keywords: ["wisdom", "growth", "ethics", "guidance"],
    careerIndications: ["education", "law", "advisory", "finance", "mentoring"],
    leadershipTraits: ["visionary", "ethical", "developmental", "inspirational"],
    personalityTraits: ["optimistic", "principled", "generous"],
    strengthThemes: ["judgment", "perspective", "mentorship"],
    challengeThemes: ["excess", "overconfidence", "dogmatism"],
  },
  Venus: {
    name: "Venus",
    keywords: ["relationships", "value", "harmony", "refinement"],
    careerIndications: ["design", "arts", "luxury", "diplomacy", "client relations"],
    leadershipTraits: ["diplomatic", "persuasive", "harmonizing", "relationship-led"],
    personalityTraits: ["gracious", "creative", "cooperative"],
    strengthThemes: ["taste", "cooperation", "creativity"],
    challengeThemes: ["indecision", "vanity", "overindulgence"],
  },
  Saturn: {
    name: "Saturn",
    keywords: ["structure", "endurance", "responsibility", "mastery"],
    careerIndications: ["engineering", "compliance", "manufacturing", "governance", "operations"],
    leadershipTraits: ["disciplined", "accountable", "systematic", "resilient"],
    personalityTraits: ["serious", "patient", "reliable"],
    strengthThemes: ["discipline", "durability", "reliability"],
    challengeThemes: ["fear", "pessimism", "isolation"],
  },
  Rahu: {
    name: "Rahu",
    keywords: ["ambition", "innovation", "disruption", "scale"],
    careerIndications: ["technology", "media", "foreign trade", "research", "venture building"],
    leadershipTraits: ["innovative", "ambitious", "unconventional", "trend-aware"],
    personalityTraits: ["resourceful", "experimental", "restless"],
    strengthThemes: ["adaptation", "boldness", "resourcefulness"],
    challengeThemes: ["obsession", "illusion", "risk-taking"],
  },
  Ketu: {
    name: "Ketu",
    keywords: ["insight", "detachment", "research", "specialization"],
    careerIndications: ["research", "investigation", "healing", "specialist advisory"],
    leadershipTraits: ["independent", "insightful", "non-attached", "specialist"],
    personalityTraits: ["private", "discerning", "introspective"],
    strengthThemes: ["depth", "objectivity", "discernment"],
    challengeThemes: ["withdrawal", "doubt", "disconnection"],
  },
};

/** Stable metadata for all twelve houses. */
export const HOUSE_MEANINGS: Readonly<Record<HouseNumber, HouseMeaning>> = {
  1: { house: 1, name: "Self", keywords: ["identity", "body", "presence"], careerRelevance: ["personal brand", "initiative"], executiveInterpretation: ["leadership presence", "operating style"] },
  2: { house: 2, name: "Resources", keywords: ["wealth", "values", "speech"], careerRelevance: ["financial stewardship", "commercial voice"], executiveInterpretation: ["resource discipline", "value creation"] },
  3: { house: 3, name: "Enterprise", keywords: ["skills", "courage", "communication"], careerRelevance: ["execution", "sales", "initiative"], executiveInterpretation: ["bias for action", "practical influence"] },
  4: { house: 4, name: "Foundation", keywords: ["home", "security", "education"], careerRelevance: ["organizational culture", "assets"], executiveInterpretation: ["institutional stability", "internal stewardship"] },
  5: { house: 5, name: "Creation", keywords: ["creativity", "intelligence", "expression"], careerRelevance: ["innovation", "strategy", "leadership"], executiveInterpretation: ["original thinking", "strategic creation"] },
  6: { house: 6, name: "Service", keywords: ["work", "health", "competition"], careerRelevance: ["operations", "service", "problem solving"], executiveInterpretation: ["operational discipline", "resilience"] },
  7: { house: 7, name: "Partnership", keywords: ["alliances", "clients", "agreements"], careerRelevance: ["client management", "negotiation", "partnerships"], executiveInterpretation: ["stakeholder alignment", "commercial relationships"] },
  8: { house: 8, name: "Transformation", keywords: ["change", "research", "shared resources"], careerRelevance: ["risk", "research", "turnarounds"], executiveInterpretation: ["change leadership", "complex problem solving"] },
  9: { house: 9, name: "Purpose", keywords: ["learning", "ethics", "perspective"], careerRelevance: ["advisory", "international work", "thought leadership"], executiveInterpretation: ["long-range judgment", "mission alignment"] },
  10: { house: 10, name: "Career", keywords: ["profession", "status", "responsibility"], careerRelevance: ["leadership", "public contribution", "management"], executiveInterpretation: ["career direction", "executive accountability"] },
  11: { house: 11, name: "Gains", keywords: ["networks", "aspirations", "returns"], careerRelevance: ["scaling", "community", "recognition"], executiveInterpretation: ["network effects", "strategic gains"] },
  12: { house: 12, name: "Release", keywords: ["solitude", "foreign links", "rest"], careerRelevance: ["research", "global work", "behind-the-scenes roles"], executiveInterpretation: ["quiet leverage", "cross-border perspective"] },
};

/** Reusable mapping from planets to representative profession categories. */
export const PLANET_PROFESSION_CATEGORIES: Readonly<
  Record<VedicPlanet, readonly string[]>
> = {
  Sun: ["government", "administration", "executive leadership", "politics"],
  Moon: ["hospitality", "healthcare", "public service", "community work"],
  Mars: ["engineering", "military", "police", "construction", "operations"],
  Mercury: ["software", "finance", "business", "media", "communication", "technology"],
  Jupiter: ["education", "law", "consulting", "finance", "advisory"],
  Venus: ["design", "arts", "luxury", "diplomacy", "relationship management"],
  Saturn: ["engineering", "compliance", "manufacturing", "governance", "operations"],
  Rahu: ["technology", "media", "foreign trade", "research", "venture building"],
  Ketu: ["research", "investigation", "healing", "specialist advisory"],
};

/** Exaltation signs for planets with classical exaltation assignments. */
export const EXALTATION_SIGNS: Readonly<
  Partial<Record<VedicPlanet, ZodiacSign>>
> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
  Rahu: "Taurus",
  Ketu: "Scorpio",
};

/** Debilitation signs for planets with classical debilitation assignments. */
export const DEBILITATION_SIGNS: Readonly<
  Partial<Record<VedicPlanet, ZodiacSign>>
> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries",
  Rahu: "Scorpio",
  Ketu: "Taurus",
};

/** Natural friendship, enmity, and neutrality for every calculation planet. */
export const PLANET_FRIENDSHIPS: Readonly<
  Record<VedicPlanet, PlanetFriendship>
> = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"], neutral: ["Mercury", "Rahu", "Ketu"] },
  Moon: { friends: ["Sun", "Mercury"], enemies: [], neutral: ["Mars", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"], neutral: ["Venus", "Saturn", "Rahu", "Ketu"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"], neutral: ["Mars", "Jupiter", "Saturn", "Rahu", "Ketu"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"], neutral: ["Saturn", "Rahu", "Ketu"] },
  Venus: { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"], neutral: ["Mars", "Jupiter", "Rahu", "Ketu"] },
  Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"], neutral: ["Jupiter", "Rahu", "Ketu"] },
  Rahu: { friends: ["Mercury", "Venus", "Saturn"], enemies: ["Sun", "Moon", "Mars"], neutral: ["Jupiter", "Ketu"] },
  Ketu: { friends: ["Mars", "Jupiter", "Saturn"], enemies: ["Sun", "Moon"], neutral: ["Mercury", "Venus", "Rahu"] },
};

/** Naturally benefic planets used by deterministic classification helpers. */
export const NATURAL_BENEFICS = ["Moon", "Mercury", "Jupiter", "Venus"] as const satisfies readonly VedicPlanet[];

/** Naturally malefic planets used by deterministic classification helpers. */
export const NATURAL_MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"] as const satisfies readonly VedicPlanet[];

/** Returns the natural ruler of a zodiac sign. */
export function getSignLord(sign: ZodiacSign): ClassicalPlanet {
  return SIGN_LORDS[sign];
}

/** Returns the static natural-meaning metadata for a planet. */
export function getPlanetMeaning(planet: VedicPlanet): PlanetNaturalMeaning {
  return PLANET_NATURAL_MEANINGS[planet];
}

/** Returns the static meaning metadata for a one-based house number. */
export function getHouseMeaning(house: HouseNumber): HouseMeaning {
  return HOUSE_MEANINGS[house];
}

/** Returns static career indications associated with a planet. */
export function getPlanetCareerMeaning(
  planet: VedicPlanet,
): readonly string[] {
  return PLANET_NATURAL_MEANINGS[planet].careerIndications;
}

/** Returns static leadership traits associated with a planet. */
export function getPlanetLeadershipMeaning(
  planet: VedicPlanet,
): readonly string[] {
  return PLANET_NATURAL_MEANINGS[planet].leadershipTraits;
}

/** Returns Graha Drishti house distances cast by a planet. */
export function getAspectPattern(planet: VedicPlanet): readonly number[] {
  return GRAHA_DRISHTI[planet];
}

/** Determines whether a planet is naturally benefic under this rule set. */
export function isNaturalBenefic(planet: VedicPlanet): boolean {
  return (NATURAL_BENEFICS as readonly VedicPlanet[]).includes(planet);
}

/** Determines whether a planet is naturally malefic under this rule set. */
export function isNaturalMalefic(planet: VedicPlanet): boolean {
  return (NATURAL_MALEFICS as readonly VedicPlanet[]).includes(planet);
}
