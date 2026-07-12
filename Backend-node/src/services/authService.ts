import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../prisma/client";
import { config } from "../config";
import { AppError } from "../errors/AppError";

export const authService = {
  async sendOtp(phone: string) {
    if (!phone || phone.length < 6) {
      throw new AppError("Invalid phone", 400);
    }

    const code = config.devOtpBypass ? config.devOtpCode : "000000";
    const session = await prisma.oTPSession.create({
      data: {
        phone,
        code,
        verified: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return {
      sid: session.id,
      devMode: config.devOtpBypass,
      hint: config.devOtpBypass ? "Use code 123456 in dev mode." : undefined,
    };
  },

  async verifyOtp(phone: string, code: string) {
    const otp = await prisma.oTPSession.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });
    if (!otp || (code !== config.devOtpCode && !config.devOtpBypass)) {
      throw new AppError("Invalid code", 401);
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNew = user == null;
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          tier: "executive",
          referralCode: `OR-${uuidv4().slice(0, 6).toUpperCase()}`,
          onboarded: false,
        },
      });
      await prisma.creditLedger.create({
        data: {
          userId: user.id,
          deltaSec: 300,
          reason: "welcome",
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
      expiresIn: `${config.jwtExpiresDays}d`,
    });

    return { token, user, isNew };
  },
};
