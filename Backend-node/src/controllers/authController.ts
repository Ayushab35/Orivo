import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { AppError } from "../errors/AppError";

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  const { phone } = req.body as { phone: string };
  if (!phone || phone.length < 6) {
    return next(new AppError("Invalid phone", 400));
  }
  try {
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
  const { phone, code } = req.body as { phone: string; code: string };
  if (!phone || phone.length < 6 || !code) {
    return next(new AppError("Invalid request", 400));
  }
  try {
    const result = await authService.verifyOtp(phone, code);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
