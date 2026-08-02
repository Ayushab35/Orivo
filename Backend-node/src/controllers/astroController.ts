import axios from "axios";
import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { config } from "../config";
import { AppError } from "../errors/AppError";
import {
  encryptDict,
  decryptDict,
  encryptionReady,
} from "../services/encryptionService";
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

export async function getBirthChart(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("Received request for birth chart:", req.body);
    const userId = (req as any).userId as string;

    // Return cached chart if available
    const cachedChart = await prisma.d1Chart.findUnique({
      where: { userId },
    });

    if (cachedChart) {
      const payload = decryptDict(cachedChart.chartEnc) || {};

      return res.json({
        ok: true,
        cached: true,
        provider: cachedChart.provider,
        chart: payload.chart,
        calculations: payload.calculations,
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

      const [dayStr, monthStr, yearStr] = birth.date.split("-");
      const [hourStr, minuteStr] = birth.time.split(":");

      day = Number(dayStr);
      month = Number(monthStr);
      year = Number(yearStr);
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

    const encrypted = encryptDict({
      chart,
      calculations: {},
    });

    if (!encrypted) {
      throw new AppError("Encryption failed", 500);
    }
    console.log("Saving encrypted chart for user:", encrypted);
    await prisma.d1Chart.create({
      data: {
        userId,
        provider: "astrologyapi",
        chartEnc: encrypted,
        encrypted: encryptionReady(),
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
