import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AuthRequest, authMiddleware } from "../../middleware/auth.js";

const router = Router();

const bannerSchema = z.object({
  image: z.string().url(),
  title: z.string().optional().nullable(),
  link: z.string().url().optional().nullable().or(z.literal("")),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

// Public: for client carousel
router.get("/", async (req, res) => {
  const branchId = (req.query.branchId as string) || "branch-main";
  const banners = await prisma.banner.findMany({
    where: { branchId, active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  res.json(banners);
});

// Admin: list all (including inactive)
router.get("/admin", authMiddleware, async (req: AuthRequest, res) => {
  const branchId = req.staff!.branchId;
  const banners = await prisma.banner.findMany({
    where: { branchId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  res.json(banners);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "URL de imagen inválida", details: parsed.error.flatten() });
  const { image, title, link, active, order } = parsed.data;
  const banner = await prisma.banner.create({
    data: {
      branchId: req.staff!.branchId,
      image,
      title: title || null,
      link: link || null,
      active: active ?? true,
      order: order ?? 0,
    },
  });
  res.status(201).json(banner);
});

router.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = bannerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const existing = await prisma.banner.findFirst({ where: { id: req.params.id, branchId: req.staff!.branchId } });
  if (!existing) return res.status(404).json({ error: "Banner no encontrado" });
  const banner = await prisma.banner.update({
    where: { id: existing.id },
    data: {
      image: parsed.data.image ?? existing.image,
      title: parsed.data.title !== undefined ? parsed.data.title : existing.title,
      link: parsed.data.link !== undefined ? parsed.data.link : existing.link,
      active: parsed.data.active ?? existing.active,
      order: parsed.data.order ?? existing.order,
    },
  });
  res.json(banner);
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const existing = await prisma.banner.findFirst({ where: { id: req.params.id, branchId: req.staff!.branchId } });
  if (!existing) return res.status(404).json({ error: "Banner no encontrado" });
  await prisma.banner.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export default router;
