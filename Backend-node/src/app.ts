import express from "express";
import cors from "cors";
import helmet from "helmet";
import "express-async-errors";
import apiRouter from "./routes/api";
import { errorHandler } from "./middleware/errorHandler";
import logger from "./logger";

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", apiRouter);
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use(errorHandler);

export default app;
