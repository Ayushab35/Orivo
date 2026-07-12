import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getChoghadia,
  getBirthChart,
  upsertD1Chart,
  getD1Chart,
  getAstroCache,
  putAstroCache,
} from "../controllers/astroController";

const router = Router();

router.get("/choghadia", requireAuth, getChoghadia);
router.post("/d1-chart", requireAuth, upsertD1Chart);
router.get("/d1-chart", requireAuth, getD1Chart);
router.get("/cache/:kind", requireAuth, getAstroCache);
router.post("/cache", requireAuth, putAstroCache);
router.post("/birth-chart", requireAuth, getBirthChart);

export default router;
