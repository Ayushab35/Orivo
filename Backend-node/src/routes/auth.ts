import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { sendOtpSchema, verifyOtpSchema } from "../schemas/auth";

const router = Router();

router.post("/otp/send", validateBody(sendOtpSchema), sendOtp);
router.post("/otp/verify", validateBody(verifyOtpSchema), verifyOtp);

export default router;
