import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { AuthRequest, authMiddleware, requireRole } from "../../middleware/auth";
import { OrderStatus, OrderType } from "@prisma/client";
import { getIO } from "../../lib/socket";

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        unitPrice: z.number(),
        qty: z.number().int().positive(),
        size: z.string().optional(),
        extras: z.any().optional(),
      })
    )
    .min(1),
  orderType: z.nativeEnum(OrderType).default(OrderType.RECOGER),
  customerName: z.string().optional(),
  tableId: z.string().optional(),
  paymentMethod: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  const { items, orderType, customerName, tableId, paymentMethod, idempotencyKey } = parsed.data;

  if (orderType === OrderType.COMER_AQUI && !tableId) {
    return res.status(400).json({ error: "tableId requerido para comer en el local" });
  }

  const pm = paymentMethod ? (paymentMethod.toUpperCase() as any) : null;

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: { idempotencyKey, branchId: req.staff!.branchId },
    });
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const order = await prisma.order.create({
    data: {
      branchId: req.staff!.branchId,
      tableId: tableId || null,
      customerName: customerName || null,
      orderType,
      status: OrderStatus.ABIERTO,
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

  getIO().to(`pedido:${order.id}`).emit("order:updated", order);

  if (tableId) {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: "PIDIENDO" as any },
    });
  }

  res.status(201).json(order);
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
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

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

  const result = await prisma.$transaction(async (tx) => {
    const seq = await tx.orderNumberSequence.upsert({
      where: { branchId: order.branchId },
      update: { current: { increment: 1 } },
      create: { branchId: order.branchId, current: 1 },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAGADO,
        orderNumber: seq.current,
        paidAt: new Date(),
      },
      include: { items: true },
    });

    return updated;
  });

  getIO().to(`pedido:${result.id}`).emit("order:paid", result);
  getIO().to(`kitchen:${result.branchId}`).emit("order:paid", result);

  res.json(result);
});

router.post("/:id/ready", authMiddleware, requireRole("COCINA"), async (req: AuthRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, branchId: req.staff!.branchId },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.LISTO, readyAt: new Date() },
    include: { items: true },
  });

  getIO().to(`pedido:${updated.id}`).emit("order:ready", updated);
  getIO().to(`kitchen:${updated.branchId}`).emit("order:ready", updated);

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
  }

  res.json(updated);
});

export default router;
