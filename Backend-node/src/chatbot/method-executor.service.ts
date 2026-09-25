import {
  AstrologyMethodName,
  AstrologyMethods,
  BirthChartData,
  MethodCallPlan,
  Planet,
} from './types';

/**
 * Deterministically executes the methods chosen by MethodSelectorChain.
 *
 * Kept separate from the LLM chains on purpose: *which* methods to call is an LLM
 * decision, but *how* to call them (arguments, ordering, dependent calls) is regular
 * code — more reliable than asking the model to also manage call arguments.
 */
export class MethodExecutorService {
  constructor(private readonly astrology: AstrologyMethods) {}

  async execute(plans: MethodCallPlan[], chart: BirthChartData): Promise<Record<string, unknown>> {
    const requested = new Set(plans.map((p) => p.method));
    const results: Record<string, unknown> = {};

    if (requested.has(AstrologyMethodName.GET_TENTH_HOUSE_LORD)) {
      results.tenthHouseLord = await this.astrology.getTenthHouseLord(chart);
    }

    if (
      requested.has(AstrologyMethodName.GET_PLANETS_ASPECTING_TENTH_HOUSE) ||
      requested.has(AstrologyMethodName.GET_ASPECT_MEANING)
    ) {
      // GET_ASPECT_MEANING needs to know which planets aspect the 10th house first,
      // so resolve this once and reuse it for both.
      results.planetsAspectingTenthHouse = await this.astrology.getPlanetsAspectingTenthHouse(chart);
    }

    if (requested.has(AstrologyMethodName.GET_ARUDHA_LAGNA)) {
      results.arudhaLagna = await this.astrology.calculateArudhaLagna(chart);
    }

    if (requested.has(AstrologyMethodName.GET_ATMAKARAKA)) {
      results.atmakaraka = await this.astrology.getAtmakaraka(chart);
    }

    if (requested.has(AstrologyMethodName.GET_ASPECT_MEANING)) {
      const aspectingPlanets = (results.planetsAspectingTenthHouse as Planet[] | undefined) ?? [];
      results.aspectMeanings = await Promise.all(
        aspectingPlanets.map(async (planet) => ({
          planet,
          meanings: await this.astrology.getAspectMeaning(planet, 10),
        }))
      );
    }

    return results;
  }
}
