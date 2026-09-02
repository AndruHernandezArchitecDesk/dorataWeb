import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AuthRequest, authMiddleware } from "../../middleware/auth";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
});

router.get("/", authMiddleware, async (_req: AuthRequest, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const existing = await prisma.category.findFirst({ where: { name: parsed.data.name } });
  if (existing) {
    return res.status(409).json({ error: "Ya existe esa categoría" });
  }
  const cat = await prisma.category.create({ data: { name: parsed.data.name } });
  res.status(201).json(cat);
});

export default router;
