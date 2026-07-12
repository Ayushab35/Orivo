import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!process.env.DATABASE_URL && mongoUrl && dbName) {
  const normalizedUrl = mongoUrl.trim().replace(/\/?$/, "");
  process.env.DATABASE_URL = `${normalizedUrl}/${dbName}`;
}

export const config = {
  port: Number(process.env.PORT ?? 8001),
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret",
  jwtExpiresDays: Number(process.env.JWT_EXPIRES_DAYS ?? 60),
  devOtpBypass: (process.env.DEV_OTP_BYPASS ?? "true").toLowerCase() === "true",
  devOtpCode: process.env.DEV_OTP_CODE ?? "123456",
  astrologyApiKey: process.env.ASTROLOGYAPI_API_KEY ?? "",
  astrologyApiBaseUrl: "https://json.astrologyapi.com/v1",
  timezoneDefault: process.env.ASTROLOGYAPI_DEFAULT_TZONE
    ? Number(process.env.ASTROLOGYAPI_DEFAULT_TZONE)
    : 5.5,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  llmDefaultProvider: (
    process.env.LLM_DEFAULT_PROVIDER ?? "anthropic"
  ).toLowerCase(),
};
