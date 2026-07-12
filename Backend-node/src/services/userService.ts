import { getISOWeek, getYear } from "date-fns";
import prisma from "../prisma/client";
import { TASKS } from "../seed_data";

export interface BirthDetailsPayload {
  name: string;
  role: string;
  businessName: string;
  industry: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthLat?: number;
  birthLng?: number;
}

export function formatUser(user: any) {
  if (!user) return null;
  return {
    id: user.id ?? user._id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    businessName: user.businessName,
    industry: user.industry,
    birth: buildBirthObject(user),
    onboarded: Boolean(user.onboarded),
    tier: user.tier,
    referralCode: user.referralCode,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    personalityQuiz: user.personalityQuiz,
  };
}

export function buildBirthObject(user: any) {
  if (!user) return null;
  const birth = {
    date: user.birthDate ?? null,
    time: user.birthTime ?? null,
    placeName: user.birthPlace ?? null,
    lat: user.birthLat ?? null,
    lng: user.birthLng ?? null,
  };
  if (
    !birth.date &&
    !birth.time &&
    !birth.placeName &&
    birth.lat == null &&
    birth.lng == null
  ) {
    return null;
  }
  return birth;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return formatUser(user);
}

export async function getCreditBalance(userId: string) {
  const result = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { deltaSec: true },
  });
  return result._sum.deltaSec ?? 0;
}

export async function addCredits(
  userId: string,
  deltaSec: number,
  reason: string,
  expiresAt?: Date,
) {
  await prisma.creditLedger.create({
    data: {
      userId,
      deltaSec,
      reason,
      expiresAt,
      createdAt: new Date(),
    },
  });
}

export async function updateBirthDetails(
  userId: string,
  payload: BirthDetailsPayload,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      role: payload.role,
      businessName: payload.businessName,
      industry: payload.industry,
      birthDate: payload.birthDate,
      birthTime: payload.birthTime,
      birthPlace: payload.birthPlace,
      birthLat: payload.birthLat,
      birthLng: payload.birthLng,
      onboarded: true,
      updatedAt: new Date(),
    },
  });
  return formatUser(user);
}

export async function listTasks(userId: string) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekKey = `W${getISOWeek(today)}-${getYear(today)}`;

  const tasks = await Promise.all(
    TASKS.map(async (task) => {
      const scopeKey =
        task.cadence === "daily"
          ? `${task.id}:${todayKey}`
          : task.cadence === "weekly"
            ? `${task.id}:${weekKey}`
            : `${task.id}:once`;

      const completed = Boolean(
        await prisma.taskCompletion.findFirst({
          where: { userId, scopeKey },
        }),
      );

      return { ...task, completed };
    }),
  );

  return tasks;
}

export async function maybeCompleteTask(userId: string, taskId: string) {
  const task = TASKS.find((item) => item.id === taskId);
  if (!task) {
    return false;
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekKey = `W${getISOWeek(today)}-${getYear(today)}`;
  const scopeKey =
    task.cadence === "daily"
      ? `${task.id}:${todayKey}`
      : task.cadence === "weekly"
        ? `${task.id}:${weekKey}`
        : `${task.id}:once`;

  const existing = await prisma.taskCompletion.findUnique({
    where: { userId_scopeKey: { userId, scopeKey } },
  });
  if (existing) {
    return false;
  }

  await prisma.taskCompletion.create({
    data: {
      userId,
      scopeKey,
      completedAt: new Date(),
    },
  });

  await addCredits(
    userId,
    task.creditsSec,
    `task:${taskId}`,
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  );
  return true;
}
