import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AuthRequest, authMiddleware, requireRole } from "../../middleware/auth";
import { OrderStatus, OrderType } from "@prisma/client";
import { getIO } from "../../lib/socket";

const router = Router();

const TAKEAWAY_FEE = 0.25;

const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string(),
          productName: z.string(),
          unitPrice: z.number(),
          qty: z.number().int().positive(),
          size: z.string().nullable().optional(),
          extras: z.any().nullable().optional(),
        })
      )
      .min(1),
    orderType: z.nativeEnum(OrderType).default(OrderType.COMER_AQUI),
    customerName: z.string().optional(),
    tableId: z.string().optional(),
    paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA"]).optional(),
    idempotencyKey: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === OrderType.PARA_LLEVAR && !data.customerName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerName"],
        message: "Nombre obligatorio para Para llevar",
      });
    }
  });

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  let { items, orderType, customerName, tableId, paymentMethod, idempotencyKey } = parsed.data;

  // COMER_AQUI desde cliente ya NO se auto-asigna a mesa; queda en cola para mesero
  // Solo mesero/admin puede crear con tableId explícito
  if (orderType === OrderType.COMER_AQUI && !tableId && req.staff?.role !== "CLIENTE_MESA") {
    // mesero puede crear sin mesa y luego asignar, permitir null
  }

  const pm = paymentMethod ? (paymentMethod.toUpperCase() as any) : null;
  if (pm && !["EFECTIVO", "TRANSFERENCIA"].includes(pm)) {
    return res.status(400).json({ error: "Método de pago no permitido. Use EFECTIVO o TRANSFERENCIA" });
  }

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: { idempotencyKey, branchId: req.staff!.branchId },
    });
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = 0;
  const fee = orderType === OrderType.PARA_LLEVAR ? TAKEAWAY_FEE : 0;
  const total = Number((subtotal + fee).toFixed(2));

  const order = await prisma.$transaction(async (tx) => {
    const seq = await tx.orderNumberSequence.upsert({
      where: { branchId: req.staff!.branchId },
      update: { current: { increment: 1 } },
      create: { branchId: req.staff!.branchId, current: 1 },
    });

    const created = await tx.order.create({
      data: {
        branchId: req.staff!.branchId,
        tableId: tableId || null,
        customerName: customerName || null,
        orderType,
        status: OrderStatus.ABIERTO,
        orderNumber: seq.current,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            qty: i.qty,
            size: i.size || null,
            extras: i.extras || null,
            addedBy: req.staff!.role,
          })),
        },
        subtotal,
        tax,
        total,
        paymentMethod: pm,
        idempotencyKey: idempotencyKey || null,
      },
      include: { items: true },
    });

    if (tableId) {
      await tx.table.update({
        where: { id: tableId },
        data: { status: "PIDIENDO" as any },
      });
    }

    return created;
  });

  getIO().to(`pedido:${order.id}`).emit("order:updated", order);

  res.status(201).json(order);
});

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const branchId = req.staff!.branchId;
  const status = (req.query.status as string | undefined) || undefined;
  const where: any = { branchId };
  if (status) {
    where.status = status;
  }
  const orders = await prisma.order.findMany({
    where,
    include: { items: true, table: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
    include: { items: true, table: true },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  res.json(order);
});

router.patch("/:id/items", authMiddleware, async (req: AuthRequest, res) => {
  const { items } = req.body as {
    items: { cartId?: string; productId?: string; qty?: number; size?: string; extras?: any }[];
  };

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
    include: { items: true },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  if (order.status !== OrderStatus.ABIERTO) {
    return res.status(400).json({ error: "No se puede modificar un pedido cerrado" });
  }

  for (const patch of items) {
    if (patch.cartId) {
      if (patch.qty && patch.qty <= 0) {
        await prisma.orderItem.delete({ where: { id: patch.cartId } });
      } else {
        await prisma.orderItem.update({
          where: { id: patch.cartId },
          data: { qty: patch.qty || 1 },
        });
      }
    } else if (patch.productId) {
      const product = await prisma.product.findUnique({ where: { id: patch.productId } });
      if (!product) continue;
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          qty: patch.qty || 1,
          size: patch.size || null,
          extras: patch.extras || null,
          addedBy: req.staff!.role,
        },
      });
    }
  }

  const allItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  const subtotal = allItems.reduce((s, i) => s + Number(i.unitPrice) * i.qty, 0);
  const tax = 0;
  const fee = order.orderType === OrderType.PARA_LLEVAR ? TAKEAWAY_FEE : 0;
  const total = Number((subtotal + fee).toFixed(2));

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { subtotal, tax, total },
    include: { items: true },
  });

  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);

  res.json(updated);
});

router.post("/:id/send-kitchen", authMiddleware, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
    include: { items: true },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.ENVIADO_COCINA,
      items: { updateMany: { where: { orderId: order.id }, data: { sentToKitchen: true } } },
    },
    include: { items: true },
  });

  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);

  res.json(updated);
});

router.post("/:id/pay", authMiddleware, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PAGADO,
      paidAt: new Date(),
    },
    include: { items: true },
  });

  getIO().to(`pedido:${updated.id}`).emit("order:paid", updated);
  getIO().to(`kitchen:${updated.branchId}`).emit("order:paid", updated);

  res.json(updated);
});

router.post("/:id/preparing", authMiddleware, requireRole("COCINA"), async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  if (order.status !== OrderStatus.ENVIADO_COCINA)
    return res.status(400).json({ error: "Solo pedidos en cocina pueden pasar a preparando" });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.PREPARANDO },
    include: { items: true, table: true },
  });
  if (updated.tableId) {
    await prisma.table.update({ where: { id: updated.tableId }, data: { status: "COCINA" as any } });
  }
  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);
  getIO().to(`kitchen:${updated.branchId}`).emit("order:updated", updated);
  getIO().to(`tables:${updated.branchId}`).emit("table:updated", updated);
  res.json(updated);
});

router.post("/:id/ready", authMiddleware, requireRole("COCINA"), async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }
  if (![OrderStatus.PREPARANDO, OrderStatus.ENVIADO_COCINA].includes(order.status as any))
    return res.status(400).json({ error: "Pedido no está en preparación" });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.LISTO, readyAt: new Date() },
    include: { items: true, table: true },
  });
  if (updated.tableId) {
    await prisma.table.update({ where: { id: updated.tableId }, data: { status: "COMIENDO" as any } });
  }

  getIO().to(`pedido:${updated.id}`).emit("order:ready", updated);
  getIO().to(`kitchen:${updated.branchId}`).emit("order:ready", updated);
  getIO().to(`tables:${updated.branchId}`).emit("table:updated", updated);
  res.json(updated);
});

router.post("/:id/served", authMiddleware, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  if (!order.tableId) return res.status(400).json({ error: "Solo mesas tienen Servido" });
  if (order.status !== OrderStatus.LISTO) return res.status(400).json({ error: "Solo pedidos listos pueden marcarse servidos" });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.ENTREGADO, releasedAt: new Date() },
    include: { items: true, table: true },
  });
  // Servido NO libera mesa
  await prisma.table.update({ where: { id: order.tableId }, data: { status: "COMIENDO" as any } });
  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);
  getIO().to(`tables:${updated.branchId}`).emit("table:updated", updated);
  res.json(updated);
});

router.post("/:id/release", authMiddleware, async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.ENTREGADO, releasedAt: new Date() },
    include: { items: true },
  });

  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);

  if (order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: "LIBRE" as any },
    });
    getIO().to(`tables:${order.branchId}`).emit("table:updated", updated);
  }

  res.json(updated);
});

router.post("/:id/assign-table", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = z.object({ tableId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "tableId requerido" });
  const { tableId } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  if (order.tableId) return res.status(409).json({ error: "El pedido ya está asignado a una mesa" });
  if (order.orderType === OrderType.PARA_LLEVAR)
    return res.status(400).json({ error: "Para llevar no se asigna a mesa" });
  if (order.status !== OrderStatus.ABIERTO)
    return res.status(400).json({ error: "Solo pedidos ABIERTOS se pueden asignar" });

  const table = await prisma.table.findFirst({
    where: { id: tableId, branchId: req.staff!.branchId },
    include: { orders: { where: { status: { in: ["ABIERTO", "ENVIADO_COCINA", "PREPARANDO", "PAGADO", "LISTO"] } } } },
  });
  if (!table) return res.status(404).json({ error: "Mesa no encontrada" });
  if (table.orders.length > 0) return res.status(409).json({ error: "La mesa ya tiene un pedido activo" });

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: { tableId },
      include: { items: true, table: true },
    });
    await tx.table.update({ where: { id: tableId }, data: { status: "PIDIENDO" as any } });
    return o;
  });

  getIO().to(`pedido:${updated.id}`).emit("order:updated", updated);
  res.json(updated);
});

export default router;
