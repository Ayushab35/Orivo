import axios from "axios";
import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { config } from "../config";
import { computeChoghadia } from "../utils/choghadia";

export interface GetChoghadiaParams {
  userId: string;
  date?: string;
  lat?: number;
  lon?: number;
  tzone?: number;
  hour?: number;
  minute?: number;
}

function safeRound(value?: number) {
  if (value === undefined || Number.isNaN(value)) return 0;
  return Number(value.toFixed(2));
}

function buildLocationKey(lat?: number, lon?: number) {
  return `loc:${safeRound(lat)}:${safeRound(lon)}`;
}

export const astroService = {
  async getChoghadia(params: GetChoghadiaParams) {
    const targetDate = params.date || new Date().toISOString().slice(0, 10);
    const lat = params.lat ?? 0;
    const lon = params.lon ?? 0;
    const locationKey = buildLocationKey(lat, lon);

    const cached = await prisma.astroCache.findFirst({
      where: {
        kind: "choghadia",
        date: targetDate,
        locationKey,
      },
    });

    if (cached) {
      return {
        cached: true,
        date: cached.date,
        payload: cached.payload,
        updatedAt: cached.updatedAt?.toISOString(),
      };
    }

    let payload: unknown;
    console.log("Astrology Api key : {}", config.astrologyApiKey);
    if (!config.astrologyApiKey) {
      payload = { chaughadiya: computeChoghadia(new Date(targetDate)) };
    } else {
      const requestBody = {
        day: Number(targetDate.slice(8, 10)),
        month: Number(targetDate.slice(5, 7)),
        year: Number(targetDate.slice(0, 4)),
        hour: params.hour ?? 6,
        min: params.minute ?? 0,
        lat,
        lon,
        tzone: params.tzone ?? config.timezoneDefault,
      };
      try {
        const response = await axios.post(
          `${config.astrologyApiBaseUrl}/chaughadiya_muhurta`,
          requestBody,
          {
            headers: {
              "x-astrologyapi-key": config.astrologyApiKey,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          },
        );
        payload = response.data;
      } catch (error) {
        payload = { chaughadiya: computeChoghadia(new Date(targetDate)) };
      }
    }

    await prisma.astroCache.create({
      data: {
        kind: "choghadia",
        date: targetDate,
        locationKey,
        lat: safeRound(lat),
        lon: safeRound(lon),
        payload: payload as Prisma.InputJsonValue,
      },
    });

    return {
      cached: false,
      payload,
    };
  },
};
