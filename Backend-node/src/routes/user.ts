import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  saveBirthDetails,
  me,
  searchCities,
  outlookToday,
  getReport,
  submitPersonalityQuiz,
  numerology,
  creditsBalance,
  creditsLedger,
  listTasks,
  completeTask,
  listPackages,
  createCheckout,
  paymentStatus,
  stripeWebhook,
  listBookings,
  createBooking,
  listNotifications,
  dashboardToday,
  getSoulPurpose,
  refreshSoulPurpose,
  getInnerProfile,
  refreshInnerProfile,
  advisorChat,
  advisorSessions,
  advisorHistory,
  listDecisions,
  logDecision,
  getRoleFit,
} from "../controllers/userController";
import {
  birthDetailsSchema,
  checkoutSchema,
  bookingSchema,
  taskCompleteSchema,
  personalityQuizSchema,
  advisorChatSchema,
  decisionSchema,
} from "../schemas/user";

const router = Router();

router.post(
  "/auth/birth-details",
  requireAuth,
  validateBody(birthDetailsSchema),
  saveBirthDetails,
);
router.get("/users/me", requireAuth, me);
router.get("/cities/search", searchCities);
router.get("/outlook/today", requireAuth, outlookToday);
router.get("/reports/:moduleKey", requireAuth, getReport);
router.post(
  "/reports/personality/quiz",
  requireAuth,
  validateBody(personalityQuizSchema),
  submitPersonalityQuiz,
);
router.get("/numerology", requireAuth, numerology);
router.get("/credits/balance", requireAuth, creditsBalance);
router.get("/credits/ledger", requireAuth, creditsLedger);
router.get("/tasks", requireAuth, listTasks);
router.post(
  "/tasks/complete",
  requireAuth,
  validateBody(taskCompleteSchema),
  completeTask,
);
router.get("/packages", listPackages);
router.post(
  "/payments/checkout",
  requireAuth,
  validateBody(checkoutSchema),
  createCheckout,
);
router.get("/payments/status/:sessionId", requireAuth, paymentStatus);
router.post("/webhook/stripe", stripeWebhook);
router.get("/bookings", requireAuth, listBookings);
router.post(
  "/bookings",
  requireAuth,
  validateBody(bookingSchema),
  createBooking,
);
router.get("/notifications", requireAuth, listNotifications);
router.get("/dashboard/today", requireAuth, dashboardToday);
router.get("/self/soul-purpose", requireAuth, getSoulPurpose);
router.post("/self/soul-purpose/refresh", requireAuth, refreshSoulPurpose);
router.get("/self/inner-profile", requireAuth, getInnerProfile);
router.post("/self/inner-profile/refresh", requireAuth, refreshInnerProfile);
router.post(
  "/advisor/chat",
  requireAuth,
  validateBody(advisorChatSchema),
  advisorChat,
);
router.get("/advisor/sessions", requireAuth, advisorSessions);
router.get("/advisor/history", requireAuth, advisorHistory);
router.get("/decisions", requireAuth, listDecisions);
router.post(
  "/decisions",
  requireAuth,
  validateBody(decisionSchema),
  logDecision,
);
router.get("/role-fit", requireAuth, getRoleFit);

export default router;
