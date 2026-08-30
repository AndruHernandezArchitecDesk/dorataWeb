import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { StaffRole } from "@prisma/client";

const router = Router();

const loginSchema = z.object({
  pin: z.string().min(4),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "PIN inválido" });
  }

  const staffList = await prisma.staff.findMany();
  if (staffList.length === 0) {
    return res.status(404).json({ error: "No hay personal registrado" });
  }

  let matched = null;
  for (const s of staffList) {
    if (await bcrypt.compare(parsed.data.pin, s.pin)) {
      matched = s;
      break;
    }
  }

  if (!matched) {
    return res.status(401).json({ error: "PIN incorrecto" });
  }

  const token = jwt.sign(
    { staffId: matched.id, branchId: matched.branchId, role: matched.role },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    staff: { id: matched.id, name: matched.name, role: matched.role, branchId: matched.branchId },
  });
});

export default router;
