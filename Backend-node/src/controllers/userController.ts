import axios from "axios";
import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma/client";
import { authService } from "../services/authService";
import * as userService from "../services/userService";
import * as reportService from "../services/reportService";
import {
  generateDailyDescription,
  generateSoulReport,
  generateInnerProfile,
} from "../services/reportGeneratorService";
import { advisorReply } from "../services/advisorService";
import { AppError } from "../errors/AppError";
import { config } from "../config";
import { numerologyProfile } from "../utils/astrology";
import { colorOfTheDay } from "../utils/choghadia";
import { currentPeriod } from "../utils/decision_intel";
import { computeRoleFit } from "../utils/role_fit";
import { decryptDict } from "../services/encryptionService";
import { PACKAGES } from "../seed_data";

function getStripeClient() {
  if (!config.stripeSecretKey) {
    throw new AppError("Stripe is not configured on this server", 503);
  }
  return new Stripe(config.stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body as { phone: string };
    const result = await authService.sendOtp(phone);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { phone, code } = req.body as { phone: string; code: string };
    const result = await authService.verifyOtp(phone, code);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function saveBirthDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const payload = req.body as any;
    const user = await userService.updateBirthDetails(userId, payload);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const balance = await userService.getCreditBalance(userId);
    return res.json({ user, creditsBalanceSec: balance });
  } catch (error) {
    return next(error);
  }
}

export async function searchCities(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }
    const url = "https://nominatim.openstreetmap.org/search";
    const response = await axios.get(url, {
      params: {
        q,
        format: "json",
        addressdetails: 1,
        limit: 8,
      },
      headers: { "User-Agent": "Orivo/1.0 (contact@orivo.life)" },
      timeout: 8000,
    });
    const data = Array.isArray(response.data) ? response.data : [];
    const results = data.map((item: any) => {
      const addr = item.address || {};
      const label = [
        addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          item.display_name,
        addr.state,
        addr.country,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        label,
        lat: Number(item.lat),
        lng: Number(item.lon),
      };
    });
    return res.json({ results });
  } catch (error) {
    return next(error);
  }
}

const REPORT_MODULES = [
  "personality",
  "strengths",
  "career",
  "publicImage",
  "financialPatterns",
];

export async function getReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const moduleKey = String(req.params.moduleKey || "");
    if (!REPORT_MODULES.includes(moduleKey)) {
      throw new AppError("Unknown report module", 404);
    }
    const existing = await prisma.report.findFirst({
      where: { userId, moduleKey },
    });
    if (existing) {
      return res.json({
        id: existing.id,
        userId: existing.userId,
        moduleKey: existing.moduleKey,
        content: existing.content,
        version: existing.version,
        createdAt: existing.createdAt.toISOString(),
      });
    }
    const user = await userService.getUserById(userId);
    if (!user || !user.birth) {
      throw new AppError("Complete birth details first", 400);
    }
    const content = await reportService.generateReport(moduleKey, user);
    const doc = await prisma.report.create({
      data: {
        userId,
        moduleKey,
        content: content as any,
        version: 1,
      },
    });
    return res.json({
      id: doc.id,
      userId: doc.userId,
      moduleKey: doc.moduleKey,
      content: doc.content,
      version: doc.version,
      createdAt: doc.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitPersonalityQuiz(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { answers } = req.body as { answers: number[] };
    if (!Array.isArray(answers) || answers.length !== 5) {
      throw new AppError("Quiz expects 5 answers", 400);
    }
    const extro = Math.round(((answers[0] + answers[1]) / 10) * 100);
    const goal = Math.round(((answers[2] + answers[3]) / 10) * 100);
    const decisive = Math.round((answers[4] / 5) * 100);
    const result = {
      summary: `You lean ${extro >= 50 ? "extroverted" : "introverted"} with a ${
        goal >= 50 ? "long-horizon" : "near-term"
      } orientation, and a ${decisive >= 60 ? "decisive" : "deliberative"} command style.`,
      axis: {
        introvertExtrovert: extro,
        goalOrientation: goal,
        decisiveness: decisive,
      },
    };
    await prisma.user.update({
      where: { id: userId },
      data: {
        personalityQuiz: {
          answers,
          result,
          at: new Date(),
        },
      },
    });
    await userService.maybeCompleteTask(userId, "complete_personality");
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function numerology(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.birthDate) {
      throw new AppError("Birth date required", 400);
    }
    return res.json(numerologyProfile(user.birthDate));
  } catch (error) {
    return next(error);
  }
}

export async function creditsBalance(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const balance = await userService.getCreditBalance(userId);
    return res.json({ balanceSec: balance });
  } catch (error) {
    return next(error);
  }
}

export async function creditsLedger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.creditLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json({
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        deltaSec: item.deltaSec,
        reason: item.reason,
        expiresAt: item.expiresAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const tasks = await userService.listTasks(userId);
    return res.json({ items: tasks });
  } catch (error) {
    return next(error);
  }
}

export async function completeTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { taskId } = req.body as { taskId: string };
    const ok = await userService.maybeCompleteTask(userId, taskId);
    if (!ok) {
      throw new AppError(
        "Task not available or already completed for this period",
        400,
      );
    }
    const balance = await userService.getCreditBalance(userId);
    return res.json({ ok: true, balanceSec: balance });
  } catch (error) {
    return next(error);
  }
}

export async function listPackages(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json({ items: PACKAGES });
  } catch (error) {
    return next(error);
  }
}

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { packageId, originUrl } = req.body as {
      packageId: string;
      originUrl: string;
    };
    const pkg = PACKAGES.find((item) => item.id === packageId);
    if (!pkg) {
      throw new AppError("Invalid package", 400);
    }
    const stripeClient = getStripeClient();
    const origin = originUrl?.trim().replace(/\/$/, "") || "";
    if (!origin) {
      throw new AppError("originUrl is required", 400);
    }
    const successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/packages`;

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(pkg.priceUsd * 100),
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        packageId: pkg.id,
        creditsSec: String(pkg.creditsSec),
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        sessionId: session.id,
        userId,
        packageId: pkg.id,
        amount: pkg.priceUsd,
        currency: "usd",
        creditsSec: pkg.creditsSec,
        status: "initiated",
        paymentStatus: "unpaid",
      },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return next(error);
  }
}

export async function paymentStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const sessionId = String(req.params.sessionId || "");

    const stripeClient = getStripeClient();

    const txn = await prisma.paymentTransaction.findUnique({
      where: { sessionId },
    });

    if (!txn) {
      throw new AppError("Transaction not found", 404);
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const paymentStatusVal = session.payment_status ?? "unpaid";
    const statusVal = session.status ?? "open";

    const alreadyCredited = txn.status === "completed";

    let balance: number | null = null;

    if (paymentStatusVal === "paid") {
      if (!alreadyCredited) {
        const creditsSec =
          txn.creditsSec ?? Number(session.metadata?.creditsSec ?? 0);

        if (creditsSec > 0) {
          await userService.addCredits(
            userId,
            creditsSec,
            `purchase:${txn.packageId}`,
          );
        }

        await prisma.paymentTransaction.update({
          where: { sessionId },
          data: {
            status: "completed",
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        });
      }

      balance = await userService.getCreditBalance(userId);
    } else if (statusVal === "expired") {
      await prisma.paymentTransaction.update({
        where: { sessionId },
        data: {
          status: "expired",
          paymentStatus: paymentStatusVal,
          updatedAt: new Date(),
        },
      });
    }

    return res.json({
      status: statusVal,
      payment_status: paymentStatusVal,
      amount_total: session.amount_total,
      currency: session.currency,
      creditsAwarded: alreadyCredited || paymentStatusVal === "paid",
      creditsBalanceSec: balance,
    });
  } catch (error) {
    return next(error);
  }
}

export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stripeClient = getStripeClient();
    const sig = String(req.headers["stripe-signature"] || "");
    const payload = req.body as Buffer;
    if (!Buffer.isBuffer(payload)) {
      throw new AppError("Invalid webhook payload", 400);
    }
    const event = stripeClient.webhooks.constructEvent(
      payload,
      sig,
      config.stripeWebhookSecret,
    );
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};
      const creditsSec = Number(meta.creditsSec ?? 0);
      const userId = String(meta.userId ?? "");
      const sid = session.id;
      const txn = await prisma.paymentTransaction.findUnique({
        where: { sessionId: sid },
      });
      if (txn && txn.status !== "completed" && userId && creditsSec > 0) {
        await userService.addCredits(
          userId,
          creditsSec,
          `purchase:${meta.packageId}`,
        );
        await prisma.paymentTransaction.update({
          where: { sessionId: sid },
          data: {
            status: "completed",
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        });
      }
    }
    return res.json({ received: true, type: event.type });
  } catch (error) {
    if (error instanceof Error && error.message.includes("stripe-signature")) {
      return next(new AppError("Invalid webhook signature", 400));
    }
    return next(error);
  }
}

export async function listBookings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.booking.findMany({
      where: { userId },
      orderBy: { slotStart: "desc" },
      take: 50,
    });
    return res.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { slotStart, slotEnd, paymentMode, packageId } = req.body as {
      slotStart: string;
      slotEnd: string;
      paymentMode: string;
      packageId: string;
    };
    const pkg = PACKAGES.find((item) => item.id === packageId);
    if (!pkg) {
      throw new AppError("Package required", 400);
    }
    const booking = {
      userId,
      packageId: pkg.id,
      slotStart,
      slotEnd,
      paymentMode,
      status: "pending",
      createdAt: new Date(),
    };
    if (paymentMode === "credits") {
      const balance = await userService.getCreditBalance(userId);
      if (balance < pkg.creditsSec) {
        throw new AppError("Insufficient credits", 400);
      }
      await userService.addCredits(
        userId,
        -pkg.creditsSec,
        `booking:${uuidv4()}`,
      );
      booking.status = "confirmed";
    }
    const created = await prisma.booking.create({ data: booking });
    return res.json({
      booking: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
      needsPayment: paymentMode !== "credits",
    });
  } catch (error) {
    return next(error);
  }
}

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    let items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    if (items.length === 0) {
      const seeds = [
        {
          userId,
          title: "Welcome to Orivo",
          body: "Your private decision-support workspace is ready.",
          read: false,
          createdAt: new Date(),
        },
        {
          userId,
          title: "Today's outlook is live",
          body: "Review your favorable windows for the day.",
          read: false,
          createdAt: new Date(),
        },
      ];
      items = await prisma.notification
        .createMany({
          data: seeds,
        })
        .then(() =>
          prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
        );
    }
    return res.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function dashboardToday(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10);
    const loginScope = `daily_login:${dateKey}`;
    const existingLogin = await prisma.taskCompletion.findUnique({
      where: { userId_scopeKey: { userId, scopeKey: loginScope } },
    });
    let awarded = false;
    if (!existingLogin) {
      await prisma.taskCompletion.create({
        data: {
          userId,
          scopeKey: loginScope,
          completedAt: new Date(),
        },
      });
      await userService.addCredits(
        userId,
        10,
        "task:daily_login",
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      );
      awarded = true;
    }

    const existingReport = await prisma.dailyReport.findFirst({
      where: { userId, date: dateKey },
    });

    if (existingReport) {
      const result = {
        id: existingReport.id,
        userId: existingReport.userId,
        date: existingReport.date,
        dayName: existingReport.dayName,
        dayDescription: existingReport.dayDescription,
        color: existingReport.color,
        choghadia: existingReport.choghadia,
        currentPeriod:
          existingReport.currentPeriod ??
          currentPeriod(
            {
              date: user.birthDate,
              time: user.birthTime,
              lat: user.birthLat,
              lng: user.birthLng,
            },
            today,
          ),
        generatedAt: existingReport.generatedAt?.toISOString() ?? null,
        dailyLoginBonusGranted: awarded,
      };
      return res.json(result);
    }

    const color = colorOfTheDay(today);
    const chartDoc = await prisma.d1Chart.findUnique({ where: { userId } });
    const chart = chartDoc ? decryptDict(chartDoc.chartEnc) : null;
    const currentPeriodData = currentPeriod(
      {
        date: user.birthDate,
        time: user.birthTime,
        lat: user.birthLat,
        lng: user.birthLng,
      },
      today,
    );
    const daily = await generateDailyDescription(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        industry: user.industry,
        birth: {
          date: user.birthDate,
          time: user.birthTime,
          placeName: user.birthPlace,
          lat: user.birthLat,
          lng: user.birthLng,
        },
      },
      color,
      // choghadia,
      chart,
    );

    const doc = await prisma.dailyReport.create({
      data: {
        userId,
        date: dateKey,
        dayName: today.toLocaleDateString("en-US", { weekday: "long" }),
        dayDescription: daily as any,
        color: color as any,
        // choghadia: choghadia as any,
        // decisionWindows: decisionWindows as any,
        currentPeriod: currentPeriodData as any,
        generatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.json({
      id: doc.id,
      userId: doc.userId,
      date: doc.date,
      dayName: doc.dayName,
      dayDescription: doc.dayDescription,
      color: doc.color,
      choghadia: doc.choghadia,
      decisionWindows: doc.decisionWindows,
      currentPeriod: doc.currentPeriod,
      generatedAt: doc.generatedAt?.toISOString() ?? null,
      dailyLoginBonusGranted: awarded,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSoulPurpose(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const existing = await prisma.soulReport.findUnique({
      where: { id: userId },
    });
    if (existing) {
      return res.json({
        id: existing.id,
        userId: existing.userId,
        content: existing.content,
        generatedAt: existing.generatedAt.toISOString(),
        version: existing.version,
      });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const chartDoc = await prisma.d1Chart.findUnique({ where: { userId } });
    const chart = chartDoc ? decryptDict(chartDoc.chartEnc) : null;
    const content = await generateSoulReport(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        industry: user.industry,
        birth: {
          date: user.birthDate,
          time: user.birthTime,
          placeName: user.birthPlace,
          lat: user.birthLat,
          lng: user.birthLng,
        },
      },
      chart,
    );
    const doc = await prisma.soulReport.create({
      data: {
        id: userId,
        userId,
        content: content as any,
        version: 1,
      },
    });
    return res.json({
      id: doc.id,
      userId: doc.userId,
      content: doc.content,
      generatedAt: doc.generatedAt.toISOString(),
      version: doc.version,
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshSoulPurpose(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    await prisma.soulReport.deleteMany({ where: { userId } });
    return await getSoulPurpose(req, res, next);
  } catch (error) {
    return next(error);
  }
}

export async function getInnerProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const existing = await prisma.personalityReport.findUnique({
      where: { id: userId },
    });
    if (existing) {
      return res.json({
        id: existing.id,
        userId: existing.userId,
        content: existing.content,
        generatedAt: existing.generatedAt.toISOString(),
        version: existing.version,
      });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const chartDoc = await prisma.d1Chart.findUnique({ where: { userId } });
    const chart = chartDoc ? decryptDict(chartDoc.chartEnc) : null;
    const content = await generateInnerProfile(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        industry: user.industry,
        birth: {
          date: user.birthDate,
          time: user.birthTime,
          placeName: user.birthPlace,
          lat: user.birthLat,
          lng: user.birthLng,
        },
      },
      chart,
    );
    const doc = await prisma.personalityReport.create({
      data: {
        id: userId,
        userId,
        content: content as any,
        version: 1,
      },
    });
    return res.json({
      id: doc.id,
      userId: doc.userId,
      content: doc.content,
      generatedAt: doc.generatedAt.toISOString(),
      version: doc.version,
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshInnerProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    await prisma.personalityReport.deleteMany({ where: { userId } });
    return await getInnerProfile(req, res, next);
  } catch (error) {
    return next(error);
  }
}

export async function advisorChat(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { message, sessionId } = req.body as {
      message: string;
      sessionId?: string;
    };
    if (!message || message.trim().length < 2) {
      throw new AppError("Message too short", 400);
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const sid = sessionId || uuidv4();
    const history = await prisma.advisorMessage.findMany({
      where: { sessionId: sid },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const formatted = history.map((item) => ({
      role: item.role,
      content: item.content,
    }));
    await prisma.advisorMessage.create({
      data: {
        userId,
        sessionId: sid,
        role: "user",
        content: message.trim(),
        createdAt: new Date(),
      },
    });
    const reply = await advisorReply(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        industry: user.industry,
        birth: {
          date: user.birthDate,
          time: user.birthTime,
          placeName: user.birthPlace,
          lat: user.birthLat,
          lng: user.birthLng,
        },
      },
      formatted,
      message.trim(),
    );
    const asstMsg = await prisma.advisorMessage.create({
      data: {
        userId,
        sessionId: sid,
        role: "assistant",
        content: reply,
        createdAt: new Date(),
      },
    });
    const title = message.trim().slice(0, 70);
    await prisma.advisorSession.upsert({
      where: { id: sid },
      update: {
        userId,
        title: title || "Advisor chat",
        lastMessage: reply.slice(0, 160),
        updatedAt: new Date(),
      },
      create: {
        id: sid,
        userId,
        title: title || "Advisor chat",
        lastMessage: reply.slice(0, 160),
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });
    return res.json({
      sessionId: sid,
      reply,
      messageId: asstMsg.id,
    });
  } catch (error) {
    return next(error);
  }
}

export async function advisorSessions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.advisorSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return res.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function advisorHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const sessionId = String(req.query.sessionId || "").trim();
    const where: any = { userId };
    if (sessionId) {
      where.sessionId = sessionId;
    }
    const items = await prisma.advisorMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return res.json({
      sessionId: sessionId || null,
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listDecisions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const items = await prisma.decision.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.json({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function logDecision(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const { title, context, decision } = req.body as {
      title: string;
      context?: string;
      decision?: string;
    };
    const doc = await prisma.decision.create({
      data: {
        userId,
        title: title.trim(),
        context: context?.trim() ?? null,
        decision: decision?.trim() ?? null,
        createdAt: new Date(),
      },
    });
    return res.json({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getRoleFit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const fit = computeRoleFit({
      birth: {
        date: user.birthDate,
        time: user.birthTime,
        lat: user.birthLat,
        lng: user.birthLng,
      },
      role: user.role,
    });
    return res.json(fit);
  } catch (error) {
    return next(error);
  }
}
