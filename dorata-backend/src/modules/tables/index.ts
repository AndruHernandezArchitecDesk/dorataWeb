import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AuthRequest, authMiddleware } from "../../middleware/auth";

const router = Router();

const createTableSchema = z.object({
  label: z.string().min(1),
  seats: z.number().int().positive().default(4),
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = createTableSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  const { label, seats } = parsed.data;

  const existing = await prisma.table.findFirst({
    where: { branchId: req.staff!.branchId, label },
  });
  if (existing) {
    return res.status(409).json({ error: "Ya existe una mesa con esa etiqueta" });
  }

  const table = await prisma.table.create({
    data: {
      branchId: req.staff!.branchId,
      label,
      seats,
      status: "LIBRE",
    },
  });

  res.status(201).json(table);
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const table = await prisma.table.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
    include: {
      orders: {
        where: {
          status: { in: ["ABIERTO", "ENVIADO_COCINA", "PAGADO", "LISTO"] },
        },
      },
    },
  });

  if (!table) {
    return res.status(404).json({ error: "Mesa no encontrada" });
  }

  if (table.orders.length > 0) {
    return res.status(409).json({ error: "No se puede eliminar una mesa con pedido activo" });
  }

  await prisma.table.delete({ where: { id: table.id } });
  res.status(204).send();
});

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const branchId = (req.query.branchId as string | undefined) || req.staff!.branchId;
    if (!branchId) {
      return res.status(400).json({ error: "branchId requerido" });
    }
    // Solo mesero/admin/caja/cocina, pero protegido por authMiddleware
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
  } catch (e) {
    console.error("GET /api/tables error", e);
    res.status(500).json({ error: "Error al cargar mesas", details: String(e) });
  }
});

export default router;
