import { Router } from "express";
import authRoutes from "./auth";
import astroRoutes from "./astro";
import userRoutes from "./user";

const router = Router();

router.use("/auth", authRoutes);
router.use("/astro", astroRoutes);
router.use("/", userRoutes);

router.get("/", (_req, res) => res.json({ name: "Orivo API", status: "ok" }));

export default router;
