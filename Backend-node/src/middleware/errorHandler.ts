import { Request, Response, NextFunction } from "express";
import logger from "../logger";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    logger.warn(`${req.method} ${req.path} -> ${err.status} ${err.message}`);
    return res.status(err.status).json({ error: err.message });
  }

  logger.error(`${req.method} ${req.path} -> unexpected error`, err);
  return res.status(500).json({ error: "Internal server error" });
}
