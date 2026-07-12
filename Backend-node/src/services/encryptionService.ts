import crypto from "crypto";

const rawKey = process.env.FIELD_ENCRYPTION_KEY ?? "";
const keys = rawKey
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const fernetKeys = keys
  .map((key) => {
    try {
      return crypto.createSecretKey(Buffer.from(key, "utf8"));
    } catch {
      return null;
    }
  })
  .filter((key): key is crypto.KeyObject => key !== null);

export function encryptionReady() {
  return fernetKeys.length > 0;
}

export function encryptDict(data: any): string | null {
  if (data == null) return null;
  const payload = JSON.stringify(data, Object.keys(data).sort(), 2);
  if (!encryptionReady()) {
    return `plain:${Buffer.from(payload).toString("base64")}`;
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", fernetKeys[0], iv);
  let encrypted = cipher.update(payload, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}.${encrypted}`;
}

export function decryptDict(payload?: string) {
  if (!payload) return null;
  if (payload.startsWith("plain:")) {
    try {
      return JSON.parse(
        Buffer.from(payload.slice(6), "base64").toString("utf8"),
      );
    } catch {
      return null;
    }
  }
  if (!encryptionReady()) return null;
  const [ivPart, encryptedPart] = payload.split(".");
  if (!ivPart || !encryptedPart) return null;
  const iv = Buffer.from(ivPart, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", fernetKeys[0], iv);
  try {
    let decrypted = decipher.update(encryptedPart, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
