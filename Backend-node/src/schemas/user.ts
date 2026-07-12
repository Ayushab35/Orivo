import { z } from "zod";

export const birthDetailsSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  businessName: z.string().min(1),
  industry: z.string().min(1),
  birthDate: z.string().min(1),
  birthTime: z.string().min(1),
  birthPlace: z.string().min(1),
  birthLat: z.number().optional(),
  birthLng: z.number().optional(),
});

export const checkoutSchema = z.object({
  packageId: z.string().min(1),
  originUrl: z.string().url(),
});

export const bookingSchema = z.object({
  slotStart: z.string().min(1),
  slotEnd: z.string().min(1),
  paymentMode: z.enum(["credits", "stripe"]),
  packageId: z.string().min(1),
});

export const taskCompleteSchema = z.object({
  taskId: z.string().min(1),
});

export const personalityQuizSchema = z.object({
  answers: z.array(z.number().min(1).max(5)).length(5),
});

export const advisorChatSchema = z.object({
  message: z.string().min(2),
  sessionId: z.string().optional(),
});

export const decisionSchema = z.object({
  title: z.string().min(1),
  context: z.string().optional(),
  decision: z.string().optional(),
});
