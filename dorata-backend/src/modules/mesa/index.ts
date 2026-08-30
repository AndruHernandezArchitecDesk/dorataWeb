import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";

const router = Router();

const tableTokenSchema = z.object({
  tableId: z.string(),
  branchId: z.string(),
});

router.post("/token", async (req, res) => {
  const parsed = tableTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const { tableId, branchId } = parsed.data;

  const table = await prisma.table.findFirst({
    where: { id: tableId, branchId },
  });

  if (!table) {
    return res.status(404).json({ error: "Mesa no encontrada" });
  }

  const token = jwt.sign(
    { tableId, branchId, role: "CLIENTE_MESA" },
    env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token, tableId, label: table.label });
});

export default router;
