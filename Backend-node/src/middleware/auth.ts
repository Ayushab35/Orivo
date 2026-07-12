import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { config } from "../config";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return next(new AppError("Missing bearer token", 401));
  }

  const token = authorization.slice(7).trim();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new AppError("Invalid token", 401));
  }
}
