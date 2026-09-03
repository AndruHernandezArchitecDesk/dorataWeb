import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const branchId = req.query.branchId as string | undefined;
  if (!branchId) {
    return res.status(400).json({ error: "branchId requerido" });
  }

  const categories = await prisma.category.findMany({
    where: { products: { some: { branchId, active: true } } },
    include: {
      products: {
        where: { branchId, active: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  res.json(categories);
});

export default router;
