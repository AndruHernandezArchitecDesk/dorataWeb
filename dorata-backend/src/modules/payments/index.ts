import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { OrderStatus } from "@prisma/client";

const router = Router();

router.get("/", async (req, res) => {
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
