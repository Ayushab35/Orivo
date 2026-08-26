import axios from "axios";
import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { config } from "../config";
import { AppError } from "../errors/AppError";
// import {
//   encryptDict,
//   decryptDict,
//   encryptionReady,
// } from "../services/encryptionService";
import { astroService } from "../services/astroService";

interface BirthChartParams {
  day?: number;
  month?: number;
  year?: number;
  hour?: number;
  minute?: number;
  lat?: number;
  lon?: number;
  tzone?: number;
}

function parseNumber(value: any): number | undefined {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseChartParams(req: Request): BirthChartParams {
  const source = req.method === "POST" ? req.body : req.query;
  return {
    day: parseNumber(source.day),
    month: parseNumber(source.month),
    year: parseNumber(source.year),
    hour: parseNumber(source.hour),
    minute: parseNumber(source.minute),
    lat: parseNumber(source.lat),
    lon: parseNumber(source.lon),
    tzone: parseNumber(source.tzone),
  };
}

export async function getChoghadia(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const birth = user
      ? {
          date: user.birthDate,
          time: user.birthTime,
          lat: user.birthLat,
          lng: user.birthLng,
        }
      : {};

    const { date, lat, lon, tzone, hour, minute } = req.query;
    let targetDate = typeof date === "string" ? date : undefined;
    let resolvedHour = typeof hour === "string" ? Number(hour) : undefined;
    let resolvedMinute =
      typeof minute === "string" ? Number(minute) : undefined;
    let resolvedLat = typeof lat === "string" ? Number(lat) : undefined;
    let resolvedLon = typeof lon === "string" ? Number(lon) : undefined;
    let resolvedTzone = typeof tzone === "string" ? Number(tzone) : undefined;

    if (!targetDate) {
      targetDate = new Date().toISOString().slice(0, 10);
    }

    if (resolvedHour == null || resolvedMinute == null) {
      if (birth.time) {
        const parts = birth.time.split(":");
        const hh = Number(parts[0]);
        const mm = Number(parts[1]);
        if (!Number.isNaN(hh)) resolvedHour = hh;
        if (!Number.isNaN(mm)) resolvedMinute = mm;
      }
      resolvedHour = resolvedHour ?? 6;
      resolvedMinute = resolvedMinute ?? 0;
    }

    if (resolvedLat == null || resolvedLon == null) {
      if (birth.lat != null && birth.lng != null) {
        resolvedLat = birth.lat;
        resolvedLon = birth.lng;
      }
      resolvedLat = resolvedLat ?? 0;
      resolvedLon = resolvedLon ?? 0;
    }

    if (resolvedTzone == null) {
      resolvedTzone = config.timezoneDefault;
    }

    const result = await astroService.getChoghadia({
      userId,
      date: targetDate,
      lat: resolvedLat,
      lon: resolvedLon,
      tzone: resolvedTzone,
      hour: resolvedHour,
      minute: resolvedMinute,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function fetchVimshottariDashaForBirth(
  birthUser: {
    date?: string | null;
    time?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null,
  overrides: Partial<BirthChartParams> = {},
  userId: string,
) {
  if (!config.astrologyApiKey) {
    throw new Error("Astrology API key is not configured");
  }

  const vimsottariDoc = await prisma.vimshotriDasha.findUnique({
    where: { userId },
  });

  // ---------------------------------------------------------
  // Helper: parse date string
  // ---------------------------------------------------------
  function parseDateString(value: any): Date | null {
    if (!value || typeof value !== "string") {
      return null;
    }

    const str = value.trim();

    // Try ISO first
    const iso = Date.parse(str);

    if (!Number.isNaN(iso)) {
      return new Date(iso);
    }

    // Supports:
    // 23-8-2024  7:17
    // 23-08-2024 07:17
    // 23-08-2024 7:17
    const match = str.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/,
    );

    if (match) {
      const dd = Number(match[1]);
      const mm = Number(match[2]);
      const yy = Number(match[3]);
      const hh = Number(match[4]);
      const min = Number(match[5]);

      return new Date(yy, mm - 1, dd, hh, min);
    }

    return null;
  }

  // ---------------------------------------------------------
  // Helper: extract minor.end
  // ---------------------------------------------------------
  function extractLatestMinorEndDate(dashaObj: any): Date | null {
    if (!dashaObj || typeof dashaObj !== "object") {
      return null;
    }

    const minor =
      dashaObj.minor ||
      dashaObj.minors ||
      dashaObj.minor_period ||
      dashaObj.minorPeriod;

    if (!minor) {
      return null;
    }

    // In case minor itself is a string
    if (typeof minor === "string") {
      return parseDateString(minor);
    }

    if (typeof minor !== "object") {
      return null;
    }

    const endKeys = ["end", "endDate", "to", "finish", "expires"];

    for (const key of endKeys) {
      if (key in minor) {
        const parsed = parseDateString(minor[key]);

        if (parsed) {
          return parsed;
        }
      }
    }

    return null;
  }

  // ---------------------------------------------------------
  // Check cached dasha
  // ---------------------------------------------------------
  if (vimsottariDoc) {
    try {
      const stored = vimsottariDoc;

      const dasha = stored.dasha;

      const minorEnd = extractLatestMinorEndDate(stored);

      const now = new Date();

      if (minorEnd && now <= minorEnd) {
        return {
          dasha: dasha,
          relationship: stored.relationship,
        };
      }
    } catch (err) {
      console.warn(
        "Could not determine stored vdasha end date; refreshing",
        err,
      );
    }
  }

  // ---------------------------------------------------------
  // Birth details
  // ---------------------------------------------------------
  let { day, month, year, hour, minute, lat, lon, tzone } = overrides;

  if (
    day == null ||
    month == null ||
    year == null ||
    hour == null ||
    minute == null ||
    lat == null ||
    lon == null
  ) {
    if (
      !birthUser ||
      !birthUser.date ||
      !birthUser.time ||
      birthUser.lat == null ||
      birthUser.lng == null
    ) {
      throw new Error("Birth details required to compute vdasha");
    }

    const dateParts = birthUser.date.split("-");
    const timeParts = birthUser.time.split(":");

    if (dateParts.length !== 3) {
      throw new Error(`Invalid birth date format: ${birthUser.date}`);
    }

    if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      year = Number(dateParts[0]);
      month = Number(dateParts[1]);
      day = Number(dateParts[2]);
    } else {
      // DD-MM-YYYY
      day = Number(dateParts[0]);
      month = Number(dateParts[1]);
      year = Number(dateParts[2]);
    }

    hour = Number(timeParts[0]);
    minute = Number(timeParts[1]);

    lat = birthUser.lat;
    lon = birthUser.lng;
  }

  if (tzone == null) {
    tzone = config.timezoneDefault;
  }

  // ---------------------------------------------------------
  // Fetch current Vimshottari Dasha
  // ---------------------------------------------------------
  const response = await axios.post(
    `${config.astrologyApiBaseUrl}/current_vdasha`,
    {
      day,
      month,
      year,
      hour,
      min: minute,
      lat,
      lon,
      tzone,
    },
    {
      headers: {
        "x-astrologyapi-key": config.astrologyApiKey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
  );

  // ---------------------------------------------------------
  // Fetch D1 chart
  // ---------------------------------------------------------
  const chartDoc = await prisma.d1Chart.findUnique({
    where: { userId },
  });

  /**
   * chartEnc may contain:
   *
   * 1. Direct array:
   * [
   *   { id: 0, name: "Sun", house: 3 },
   *   ...
   * ]
   *
   * 2. Object:
   * {
   *   chart: [
   *     { id: 0, name: "Sun", house: 3 },
   *     ...
   *   ]
   * }
   *
   * 3. Stringified JSON
   *
   * Handle all of them.
   */
  function extractChart(data: any): any[] {
    if (!data) {
      return [];
    }

    // If JSON string
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return [];
      }
    }

    // Direct array
    if (Array.isArray(data)) {
      return data;
    }

    // Object containing chart
    if (Array.isArray(data.chart)) {
      return data.chart;
    }

    return [];
  }

  const chart = extractChart(chartDoc?.chartEnc);

  // ---------------------------------------------------------
  // Find planet by planet ID
  // ---------------------------------------------------------
  function findPlanetById(
    chartData: any[],
    planetId: number | null | undefined,
  ) {
    if (planetId == null) {
      return null;
    }

    return (
      chartData.find((planet) => Number(planet?.id) === Number(planetId)) ||
      null
    );
  }

  // ---------------------------------------------------------
  // Calculate relationship between two planets
  //
  // Rules:
  //
  // Same house:
  //   3 -> 3 = 1-1
  //
  // Separation:
  //   1 house = 2-12
  //   2 houses = 3-11
  //   3 houses = 4-10
  //   4 houses = 5-9
  //   5 houses = 6-8
  //   6 houses = 1-7
  //
  // The relationship is symmetric.
  // ---------------------------------------------------------
  function calculatePlanetRelationship(
    majorPlanet: any,
    minorPlanet: any,
  ): string | null {
    if (!majorPlanet || !minorPlanet) {
      return null;
    }

    const majorHouse = Number(majorPlanet?.house);
    const minorHouse = Number(minorPlanet?.house);

    // Invalid house
    if (
      !Number.isInteger(majorHouse) ||
      !Number.isInteger(minorHouse) ||
      majorHouse < 1 ||
      majorHouse > 12 ||
      minorHouse < 1 ||
      minorHouse > 12
    ) {
      return null;
    }

    // Same house
    if (majorHouse === minorHouse) {
      return "1-1";
    }

    /**
     * Circular distance between houses.
     *
     * Example:
     * Jupiter = 9
     * Sun = 3
     *
     * difference = |9 - 3| = 6
     *
     * Since houses wrap around 12, use the smaller
     * circular distance.
     */
    const directDifference = Math.abs(majorHouse - minorHouse);

    const circularDifference = Math.min(
      directDifference,
      12 - directDifference,
    );

    switch (circularDifference) {
      case 1:
        return "2-12";

      case 2:
        return "3-11";

      case 3:
        return "4-10";

      case 4:
        return "5-9";

      case 5:
        return "6-8";

      case 6:
        return "1-7";

      default:
        return null;
    }
  }

  // ---------------------------------------------------------
  // Extract Major and Minor Dasha planets
  // ---------------------------------------------------------
  const dashaResponse = response.data;

  const major = dashaResponse?.major;
  const minor = dashaResponse?.minor;

  const majorPlanet = findPlanetById(chart, major?.planet_id);

  const minorPlanet = findPlanetById(chart, minor?.planet_id);

  // ---------------------------------------------------------
  // Calculate relationship
  // ---------------------------------------------------------
  const relationship = calculatePlanetRelationship(majorPlanet, minorPlanet);

  // ---------------------------------------------------------
  // Optional logging for debugging
  // ---------------------------------------------------------
  console.log("Vimshottari Dasha Relationship:", {
    major: major?.planet,
    majorPlanetId: major?.planet_id,
    majorHouse: majorPlanet?.house,

    minor: minor?.planet,
    minorPlanetId: minor?.planet_id,
    minorHouse: minorPlanet?.house,

    relationship,
  });

  // ---------------------------------------------------------
  // Store dasha + relationship
  // ---------------------------------------------------------
  const dasha = await prisma.vimshotriDasha.upsert({
    where: { userId },

    update: {
      dasha: dashaResponse,
      version: {
        increment: 1,
      },
      relationship,
    },

    create: {
      userId,
      dasha: dashaResponse,
      version: 1,
      relationship,
    },
  });

  return {
    dasha: dasha.dasha,
    relationship: dasha.relationship,
  };
}

export async function getBirthChart(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("Received request for birth chart:", req.body);
    const userId = (req as any).userId as string;
    console.log("Fetching birth chart for user:", userId);
    // Return cached chart if available
    const cachedChart = await prisma.d1Chart.findUnique({
      where: { userId },
    });

    if (cachedChart) {
      const payload = cachedChart.chartEnc || {};

      return res.json({
        ok: true,
        cached: true,
        provider: cachedChart.provider,
        chart: payload,
        calculations: {},
        updatedAt: cachedChart.updatedAt?.toISOString() ?? null,
      });
    }

    if (!config.astrologyApiKey) {
      throw new AppError("Astrology API key is not configured", 503);
    }

    const params = parseChartParams(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("User details for birth chart request:", user);

    const birth = user
      ? {
          date: user.birthDate,
          time: user.birthTime,
          lat: user.birthLat,
          lng: user.birthLng,
        }
      : null;

    let { day, month, year, hour, minute, lat, lon, tzone } = params;

    if (
      day == null ||
      month == null ||
      year == null ||
      hour == null ||
      minute == null ||
      lat == null ||
      lon == null
    ) {
      if (
        !birth ||
        !birth.date ||
        !birth.time ||
        birth.lat == null ||
        birth.lng == null
      ) {
        throw new AppError("Birth details required", 400);
      }

      const dateParts = birth.date.split("-");
      const [hourStr, minuteStr] = birth.time.split(":");

      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          // ISO format: YYYY-MM-DD
          year = Number(dateParts[0]);
          month = Number(dateParts[1]);
          day = Number(dateParts[2]);
        } else {
          // Day-first format: DD-MM-YYYY
          day = Number(dateParts[0]);
          month = Number(dateParts[1]);
          year = Number(dateParts[2]);
        }
      }

      hour = Number(hourStr);
      minute = Number(minuteStr);
      lat = birth.lat;
      lon = birth.lng;
    }

    if (tzone == null) {
      tzone = config.timezoneDefault;
    }

    const response = await axios.post(
      `${config.astrologyApiBaseUrl}/planets`,
      {
        day,
        month,
        year,
        hour,
        min: minute,
        lat,
        lon,
        tzone,
      },
      {
        headers: {
          "x-astrologyapi-key": config.astrologyApiKey,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const chart = response.data;
    console.log(
      "Received birth chart from Astrology API for user:",
      userId,
      "chart:",
      chart,
    );
    // const encrypted = encryptDict({
    //   chart,
    //   calculations: {},
    // });

    // if (!encrypted) {
    //   throw new AppError("Encryption failed", 500);
    // }
    console.log("Saving encrypted chart for user:", chart);
    await prisma.d1Chart.create({
      data: {
        userId,
        provider: "astrologyapi",
        chartEnc: chart,
        encrypted: false,
        // encrypted: encryptionReady(),
      },
    });
    console.log("Saved encrypted chart for user:", userId);
    return res.json({
      ok: true,
      cached: false,
      chart,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return next(
        new AppError(
          `Astrology API error: ${JSON.stringify(error.response.data)}`,
          error.response.status,
        ),
      );
    }

    return next(error);
  }
}
