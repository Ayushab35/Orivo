// ---------------------------------------------------------------------------
// Astrology domain types — adjust these to match your existing implementation.
// ---------------------------------------------------------------------------

export enum Planet {
  SUN = 'Sun',
  MOON = 'Moon',
  MARS = 'Mars',
  MERCURY = 'Mercury',
  JUPITER = 'Jupiter',
  VENUS = 'Venus',
  SATURN = 'Saturn',
  RAHU = 'Rahu',
  KETU = 'Ketu',
  ASCENDANT = 'Ascendant',
}

/**
 * Placeholder for your existing birth-chart representation. Replace/extend with
 * whatever structure your chart-computation code already produces (planetary
 * longitudes, house cusps, ascendant, etc.). The LangChain chains never look inside
 * this object directly — only your AstrologyMethods implementation does.
 */
export interface PlanetaryPosition {
  id: number;
  planet: Planet;
  house: number;
  sign: string;
  signLord: Planet;
  fullDegree?: number;
  normDegree?: number;
}

export interface BirthChartData {
  chart: PlanetaryPosition[];
}


export interface ArudhaLagnaResult {
  house: number;
  sign: string;
}

/**
 * Contract for your existing astrology helper methods. Implement this in
 * astrology-data.service.ts with your real logic — everything downstream only
 * depends on this interface, not on how the calculations actually work.
 */
export interface AstrologyMethods {
  getTenthHouseLord(chart: BirthChartData): Promise<Planet> | Planet;
  getPlanetsAspectingTenthHouse(chart: BirthChartData): Promise<Planet[]> | Planet[];
  calculateArudhaLagna(chart: BirthChartData): Promise<ArudhaLagnaResult> | ArudhaLagnaResult;
  getAtmakaraka(chart: BirthChartData): Promise<Planet> | Planet;
  getAspectMeaning(planet: Planet, house: number): Promise<string[]> | string[];
}

// ---------------------------------------------------------------------------
// Chatbot pipeline types
// ---------------------------------------------------------------------------

export enum AstrologyMethodName {
  GET_TENTH_HOUSE_LORD = 'GET_TENTH_HOUSE_LORD',
  GET_PLANETS_ASPECTING_TENTH_HOUSE = 'GET_PLANETS_ASPECTING_TENTH_HOUSE',
  GET_ARUDHA_LAGNA = 'GET_ARUDHA_LAGNA',
  GET_ATMAKARAKA = 'GET_ATMAKARAKA',
  GET_ASPECT_MEANING = 'GET_ASPECT_MEANING',
}

/** Single source of truth for what each method does — used to build the planner's prompt. */
export const ASTROLOGY_METHOD_CATALOG: Record<AstrologyMethodName, string> = {
  [AstrologyMethodName.GET_TENTH_HOUSE_LORD]:
    'Returns the planet ruling the 10th house — the primary significator of career, profession, and public standing.',
  [AstrologyMethodName.GET_PLANETS_ASPECTING_TENTH_HOUSE]:
    'Returns the planets that cast an aspect (drishti) on the 10th house.',
  [AstrologyMethodName.GET_ARUDHA_LAGNA]:
    'Computes the Arudha Lagna (A1) — the public image/perception of the person or their business.',
  [AstrologyMethodName.GET_ATMAKARAKA]:
    'Returns the Atmakaraka (soul-significator planet) — relevant to core purpose and long-term career direction.',
  [AstrologyMethodName.GET_ASPECT_MEANING]:
    'Given a planet aspecting the 10th house, returns the business/career significations of that aspect (e.g. Mars -> administration, bravery, sports).',
};

export interface GuardrailResult {
  inScope: boolean;
  reason: string;
}

export interface RephraseResult {
  rephrasings: string[];
}

export interface MethodCallPlan {
  method: AstrologyMethodName;
  reason: string;
}

export interface MethodSelectionResult {
  methods: MethodCallPlan[];
}

export interface FinalAnswerResult {
  answer: string;
}

export enum ChatbotStatus {
  SUCCESS = 'SUCCESS',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  ERROR = 'ERROR',
}

/** Shape returned to your controller/application for every request. */
export interface ChatbotResponse {
  status: ChatbotStatus;
  answer: string;
}
