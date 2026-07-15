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
    if (!config.astrologyApiKey) {
      throw new AppError("Astrology API key is not configured", 503);
    }
    const userId = (req as any).userId as string;
    const params = parseChartParams(req);
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
    return res.json({ ok: true, chart: response.data });
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

export async function upsertD1Chart(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { provider, chart, calculations } = req.body as {
      provider: string;
      chart: any;
      calculations?: any;
    };
    if (!provider || !chart) {
      throw new AppError("provider and chart are required", 400);
    }
    const encrypted = encryptDict({ chart, calculations: calculations ?? {} });
    if (!encrypted) {
      throw new AppError("Encryption failed", 500);
    }
    await prisma.d1Chart.upsert({
      where: { userId },
      update: {
        provider,
        chartEnc: encrypted,
        encrypted: encryptionReady(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider,
        chartEnc: encrypted,
        encrypted: encryptionReady(),
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });
    await prisma.dailyReport.deleteMany({ where: { userId } });
    await prisma.soulReport.deleteMany({ where: { userId } });
    await prisma.personalityReport.deleteMany({ where: { userId } });
    return res.json({ ok: true, encrypted: encryptionReady() });
  } catch (error) {
    return next(error);
  }
}

export async function getD1Chart(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const doc = await prisma.d1Chart.findUnique({ where: { userId } });
    if (!doc) {
      return res.json({ cached: false, chart: null });
    }
    const payload = decryptDict(doc.chartEnc) || {};
    return res.json({
      cached: true,
      provider: doc.provider,
      chart: payload.chart,
      calculations: payload.calculations,
      encrypted: Boolean(doc.encrypted),
      updatedAt: doc.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return next(error);
  }
}
