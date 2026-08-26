import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getChoghadia,
  getBirthChart,
  // getVimshottariDasha,
} from "../controllers/astroController";

const router = Router();

router.get("/choghadia", requireAuth, getChoghadia);
router.post("/birth-chart", requireAuth, getBirthChart);
// router.post("/vimsottari-dasha", requireAuth, getVimshottariDasha);

export default router;
