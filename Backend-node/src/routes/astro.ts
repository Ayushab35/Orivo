import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getChoghadia,
  getBirthChart,
} from "../controllers/astroController";

const router = Router();

router.get("/choghadia", requireAuth, getChoghadia);
router.post("/birth-chart", requireAuth, getBirthChart);

export default router;
