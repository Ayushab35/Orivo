import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z.string().min(6),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(1),
});
