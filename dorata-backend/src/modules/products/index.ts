import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AuthRequest, authMiddleware } from "../../middleware/auth";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string(),
  price: z.number().positive(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  hasExtras: z.boolean().optional(),
  hasSize: z.boolean().optional(),
  active: z.boolean().optional(),
  tag: z.string().nullable().optional(),
});

// ---- Productos ----
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const branchId = req.query.branchId as string | undefined;
  if (!branchId) {
    return res.status(400).json({ error: "branchId requerido" });
  }
  const products = await prisma.product.findMany({
    where: { branchId },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  res.json(products);
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      branchId: req.staff!.branchId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      image: data.image ?? null,
      emoji: data.emoji ?? null,
      hasExtras: data.hasExtras ?? false,
      hasSize: data.hasSize ?? false,
      active: data.active ?? true,
      tag: data.tag ?? null,
    },
  });
  res.status(201).json(product);
});

router.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.categoryId && { categoryId: parsed.data.categoryId }),
      ...(parsed.data.price != null && { price: parsed.data.price }),
      description: parsed.data.description ?? existing.description,
      image: parsed.data.image ?? existing.image,
      emoji: parsed.data.emoji ?? existing.emoji,
      hasExtras: parsed.data.hasExtras ?? existing.hasExtras,
      hasSize: parsed.data.hasSize ?? existing.hasSize,
      active: parsed.data.active ?? existing.active,
      tag: parsed.data.tag ?? existing.tag,
    },
  });
  res.json(product);
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  await prisma.product.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export default router;
