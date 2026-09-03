import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { OrderStatus } from "@prisma/client";
import { AuthRequest, authMiddleware } from "../../middleware/auth.js";

const router = Router();

const ITEM_STATUS_SCHEMA = z.object({
  items: z.array(
    z.object({
      cartId: z.string().optional(),
      productId: z.string().optional(),
      qty: z.number().int().optional(),
    })
  ),
});

router.get("/queue", authMiddleware, async (req: AuthRequest, res) => {
  const branchId = (req.query.branchId as string | undefined) || req.staff!.branchId;
  if (!branchId) {
    return res.status(400).json({ error: "branchId requerido" });
  }

  const queue = await prisma.order.findMany({
    where: { branchId, status: { in: [OrderStatus.ENVIADO_COCINA, OrderStatus.PREPARANDO] } },
    include: { items: true, table: true },
    orderBy: { createdAt: "asc" },
  });

  res.json(queue);
});

export default router;
