/**
 * Names of chart points supported by the soul report module.
 */
export type PlanetName =
  | "Sun"
  | "Moon"
  | "Mars"
  | "Mercury"
  | "Jupiter"
  | "Venus"
  | "Saturn"
  | "Rahu"
  | "Ketu"
  | "Ascendant";

/**
 * The twelve signs of the zodiac.
 */
export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

/**
 * A celestial body or chart point and its calculated chart position.
 */
export interface Planet {
  /** Provider-specific identifier for the planet or chart point. */
  id: number;
  /** Name of the planet or chart point. */
  name: PlanetName;
  /** Zodiac sign containing the planet. */
  sign: ZodiacSign;
  /** House occupied by the planet, numbered 1 through 12. */
  house: number;
  /** Absolute ecliptic longitude, in degrees from 0 to 360. */
  fullDegree?: number;
  /** Degree within the current zodiac sign, from 0 to less than 30. */
  normDegree?: number;
}

/**
 * Scored assessment of achievement-oriented chart factors.
 */
export interface GoalOrientationResult {
  /** Total goal-orientation score. */
  score: number;
  /** Human-readable category derived from the total score. */
  category: string;
  /** Scores for each contributing chart factor. */
  breakdown: {
    /** Planetary dignity contribution. */
    dignity: number;
    /** Upper-hemisphere contribution. */
    upperHemisphere: number;
    /** Upachaya-house contribution. */
    upachaya: number;
    /** Mars contribution. */
    mars: number;
    /** Saturn contribution. */
    saturn: number;
    /** Sun contribution. */
    sun: number;
    /** Tenth-house lord contribution. */
    tenthLord: number;
    /** Eleventh-house lord contribution. */
    eleventhLord: number;
    /** Dharma-Artha contribution. */
    dharmaArtha: number;
    /** Raj Yoga contribution. */
    rajYoga: number;
  };
  /** Human-readable observations based on the result. */
  insights: string[];
}

/**
 * A geometric relationship between two planets in a birth chart.
 */
export interface PlanetAspect {
  /** First planet participating in the aspect. */
  planet: PlanetName;
  /** Second planet participating in the aspect. */
  aspectedPlanet: PlanetName;
  /** Name of the aspect, such as conjunction, trine, or opposition. */
  aspect: string;
  /** Angular distance between the planets, in degrees. */
  angle: number;
  /** Optional deviation from the exact aspect, in degrees. */
  orb?: number;
}

/**
 * The calculated Atmakaraka, the planet with the highest degree in its sign.
 */
export interface AtmakarakaResult {
  /** Planet identified as the Atmakaraka. */
  planet: Planet;
  /** Degree used to determine the Atmakaraka. */
  degree: number;
  /** Sign occupied by the Atmakaraka. */
  sign: ZodiacSign;
  /** House occupied by the Atmakaraka. */
  house: number;
  /** Strength keywords associated with the Atmakaraka. */
  keywords: readonly string[];
  /** Career expressions associated with the Atmakaraka. */
  careerMeaning: readonly string[];
  /** Leadership traits associated with the Atmakaraka. */
  leadershipMeaning: readonly string[];
}

/**
 * The calculated Arudha Lagna and its static public-facing metadata.
 */
export interface ArudhaLagnaResult {
  /** Sign in which the Arudha Lagna falls. */
  sign: ZodiacSign;
  /** House number of the Arudha Lagna. */
  house: number;
  /** Natural ruler of the ascendant sign. */
  lagnaLord: PlanetName;
  /** Number of signs counted from the ascendant to its lord. */
  distance: number;
  /** Strength keywords associated with the Lagna lord. */
  keywords: readonly string[];
  /** Public-facing traits associated with the Lagna lord. */
  publicTraits: readonly string[];
}

/**
 * Static career indicators contributed by a planet in a tenth-house analysis.
 */
export interface CareerIndicator {
  /** Planet contributing the career indicators. */
  planet: PlanetName;
  /** Static career themes associated with the planet. */
  indicators: readonly string[];
}

/**
 * Deterministic chart factors associated with the tenth house.
 */
export interface TenthHouseAnalysis {
  /** Number of the career house. */
  tenthHouse: number;
  /** Sign on the tenth-house cusp. */
  tenthSign: ZodiacSign;
  /** Natural ruler of the tenth-house sign. */
  tenthLord: PlanetName;
  /** Chart position of the tenth lord, when it exists in the chart. */
  tenthLordPlacement: Planet | undefined;
  /** Planets positioned in the tenth house. */
  planetsInTenth: Planet[];
  /** Planets casting Graha Drishti on the tenth house. */
  planetsAspectingTenth: Planet[];
  /** Static career indicators from the tenth lord, occupants, and aspectors. */
  careerIndicators: CareerIndicator[];
}

/**
 * A ranked professional field suggested by the chart analysis.
 */
export interface ProfessionField {
  /** Name of the professional field or career theme. */
  name: string;
  /** Brief explanation for why this field is relevant. */
  rationale: string;
  /** Relative suitability score from 0 to 100. */
  score: number;
}

/**
 * A planet's static contribution to a deterministic profession analysis.
 */
export interface PlanetExplanation {
  /** Planet contributing the explanation. */
  planet: PlanetName;
  /** Static meaning associated with the planet. */
  meaning: string;
  /** Career fields associated with the planet. */
  careerFields: readonly string[];
}

/**
 * Deterministic aspect data supplied to profession analysis.
 */
export interface AspectAnalysis {
  /** Planets whose aspects are relevant to the career analysis. */
  aspectingPlanets: Planet[];
  /** Static meanings associated with the aspecting planets. */
  meanings: readonly string[];
}

/**
 * Consolidated deterministic analysis of career-related chart factors.
 */
export interface ProfessionAnalysis {
  /** Tenth-house specific analysis. */
  tenthHouse: TenthHouseAnalysis;
  /** Atmakaraka result used in the interpretation. */
  atmakaraka: AtmakarakaResult;
  /** Aspect data used in the analysis. */
  aspects: AspectAnalysis;
  /** Static combined effect of the contributing planets. */
  combinedEffect: string[];
  /** Per-planet explanations used to derive the output. */
  planetExplanations: PlanetExplanation[];
  /** Five highest-ranked profession fields. */
  topProfessions: ProfessionField[];
  /** Static strengths associated with the contributing planets. */
  strengths: string[];
  /** Static potential weaknesses associated with the contributing planets. */
  possibleWeaknesses: string[];
  /** Work-environment themes associated with the contributing planets. */
  careerEnvironment: string[];
  /** Leadership-style traits associated with the contributing planets. */
  leadershipStyle: string[];
}

/**
 * Structured chart data supplied to the language model for report generation.
 */
export interface SoulPromptData {
  /** Native's date of birth in ISO-8601 date format. */
  birthDate: string;
  /** Native's time of birth in 24-hour time format. */
  birthTime: string;
  /** Latitude of the birth location. */
  latitude: number;
  /** Longitude of the birth location. */
  longitude: number;
  /** Time-zone offset from UTC, in hours. */
  timezone: number;
  /** Calculated planetary positions. */
  planets: Planet[];
  /** Calculated planetary aspects. */
  aspects: PlanetAspect[];
  /** Derived profession analysis. */
  professionAnalysis: ProfessionAnalysis;
}

/**
 * User context that may be included in a soul-report prompt.
 */
export interface SoulReportUser {
  /** User's preferred display name. */
  name?: string | null;
  /** User's present professional role. */
  role?: string | null;
  /** User's business or organization name. */
  businessName?: string | null;
  /** User's business sector or industry. */
  industry?: string | null;
}

/**
 * The completed soul report returned by the module.
 */
export interface SoulReport {
  /** Human-readable title of the report. */
  title: string;
  /** High-level summary of the report's findings. */
  summary: string;
  /** Narrative describing the individual's core soul themes. */
  soulPurpose: string;
  /** Narrative describing professional direction and expression. */
  profession: string;
  /** Strengths highlighted by the report. */
  strengths: string[];
  /** Growth areas highlighted by the report. */
  growthAreas: string[];
  /** Concrete recommendations generated by the report. */
  recommendations: string[];
  /** Chart analysis from which the report was generated. */
  analysis: ProfessionAnalysis;
}

/**
 * A single text block returned by an LLM provider.
 */
export interface LLMResponseContent {
  /** Type of content block returned by the provider. */
  type: string;
  /** Text contained in this block. */
  text: string;
}

/**
 * Token-usage metadata returned by an LLM provider.
 */
export interface LLMResponseUsage {
  /** Number of tokens in the submitted prompt. */
  inputTokens: number;
  /** Number of tokens generated in the response. */
  outputTokens: number;
  /** Total number of tokens consumed, when supplied by the provider. */
  totalTokens?: number;
}

/**
 * Provider-neutral response shape used by the soul report LLM integration.
 */
export interface LLMResponse {
  /** Identifier of the model that produced the response. */
  model: string;
  /** Reason generation stopped. */
  stopReason?: string;
  /** Text content blocks returned by the model. */
  content: LLMResponseContent[];
  /** Optional token-usage metadata. */
  usage?: LLMResponseUsage;
}

/**
 * Parsed structured output expected from the LLM for a soul report.
 */
export interface SoulReportLLMResponse {
  /** Executive narrative describing the person's core purpose. */
  soulPurpose: {
    /** Core purpose statement. */
    corePurpose: string;
    /** Principal operating themes. */
    keyThemes: string[];
    /** Practical operating principles. */
    operatingPrinciples: string[];
  };
  /** Executive narrative describing professional direction. */
  profession: {
    /** Primary professional direction. */
    primaryDirection: string;
    /** Relevant profession fields. */
    topProfessions: string[];
    /** Professional strengths. */
    strengths: string[];
    /** Suitable working environments. */
    careerEnvironment: string[];
    /** Leadership style traits. */
    leadershipStyle: string[];
    /** Development risks to monitor. */
    developmentRisks: string[];
  };
  /** Executive narrative describing outward perception. */
  publicImage: {
    /** Likely external perception. */
    perception: string;
    /** Leadership presence in public settings. */
    leadershipPresence: string;
    /** Expected effect on stakeholders. */
    stakeholderImpact: string;
  };
}
