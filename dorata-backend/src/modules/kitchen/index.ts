import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { OrderStatus } from "@prisma/client";

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

router.get("/queue", async (req, res) => {
  const branchId = req.query.branchId as string | undefined;
  if (!branchId) {
    return res.status(400).json({ error: "branchId requerido" });
  }

  const queue = await prisma.order.findMany({
    where: { branchId, status: OrderStatus.PAGADO },
    include: { items: true },
    orderBy: { paidAt: "asc" },
  });

  res.json(queue);
});

export default router;
