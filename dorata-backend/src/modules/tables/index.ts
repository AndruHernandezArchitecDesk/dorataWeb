import { Router } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
  const branchId = req.query.branchId as string | undefined;
  if (!branchId) {
    return res.status(400).json({ error: "branchId requerido" });
  }

  const tables = await prisma.table.findMany({
    where: { branchId },
    include: {
      orders: {
        where: {
          status: { in: ["ABIERTO", "ENVIADO_COCINA", "PAGADO", "LISTO"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { label: "asc" },
  });

  res.json(
    tables.map((t) => ({
      id: t.id,
      label: t.label,
      seats: t.seats,
      status: t.status,
      activeOrder: t.orders[0] || null,
    }))
  );
});

export default router;
