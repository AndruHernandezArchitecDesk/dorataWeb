import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: { id: "branch-main", name: "Sucursal Centro" },
  });

  const categories = await Promise.all(
    ["Combos", "Hamburguesas", "Papas", "Bebidas", "Postres"].map((name) =>
      prisma.category.create({ data: { name } })
    )
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  await prisma.product.createMany({
    data: [
      { branchId: branch.id, categoryId: catMap["Combos"], name: "Combo Clásico", price: 8.5, emoji: "🍔", description: "Fuego Classic + papas + bebida.", hasExtras: true },
      { branchId: branch.id, categoryId: catMap["Combos"], name: "Combo Doble Fuego", price: 10.9, emoji: "🔥", description: "Doble Queso + papas grandes + bebida.", hasExtras: true },
      { branchId: branch.id, categoryId: catMap["Hamburguesas"], name: "Fuego Classic", price: 5.5, emoji: "🍔", description: "Carne a la parrilla, queso, lechuga y salsa fuego.", hasExtras: true },
      { branchId: branch.id, categoryId: catMap["Hamburguesas"], name: "Doble Queso", price: 6.9, emoji: "🧀", description: "Doble carne, doble queso cheddar fundido.", hasExtras: true },
      { branchId: branch.id, categoryId: catMap["Hamburguesas"], name: "Picante Jalapeño", price: 6.5, emoji: "🌶️", description: "Jalapeños frescos, pepper jack y salsa chipotle.", hasExtras: true },
      { branchId: branch.id, categoryId: catMap["Papas"], name: "Papas Clásicas", price: 2.5, emoji: "🍟", description: "Cortadas a mano, crujientes por fuera.", hasSize: true },
      { branchId: branch.id, categoryId: catMap["Papas"], name: "Papas con Queso", price: 3.9, emoji: "🧀", description: "Bañadas en queso cheddar y tocino.", hasSize: true },
      { branchId: branch.id, categoryId: catMap["Papas"], name: "Aros de Cebolla", price: 3.2, emoji: "🧅", description: "Empanizado dorado, salsa ranch incluida.", hasSize: true },
      { branchId: branch.id, categoryId: catMap["Bebidas"], name: "Refresco", price: 1.8, emoji: "🥤", description: "Cola, naranja o limón.", hasSize: true },
      { branchId: branch.id, categoryId: catMap["Bebidas"], name: "Malteada Chocolate", price: 3.5, emoji: "🥤", description: "Cremosa, con crema batida.", hasSize: true },
      { branchId: branch.id, categoryId: catMap["Bebidas"], name: "Agua", price: 1.2, emoji: "💧", description: "Botella 500ml." },
      { branchId: branch.id, categoryId: catMap["Postres"], name: "Volcán de Chocolate", price: 3.0, emoji: "🍫", description: "Centro líquido, servido caliente." },
      { branchId: branch.id, categoryId: catMap["Postres"], name: "Helado Suave", price: 2.2, emoji: "🍦", description: "Vainilla o chocolate en cono." },
    ],
    skipDuplicates: true,
  });

  const extras = await prisma.extra.createMany({
    data: [
      { name: "Queso extra", price: 0.8 },
      { name: "Tocino", price: 1.2 },
      { name: "Aguacate", price: 1.0 },
      { name: "Doble carne", price: 2.5 },
      { name: "Sin cebolla", price: 0 },
      { name: "Extra picante", price: 0 },
    ],
    skipDuplicates: true,
  });

  const staffSeed = [
    { id: "staff-admin", name: "Admin", pin: "1234", role: "ADMIN" },
    { id: "staff-mesero", name: "Mesero", pin: "5678", role: "MESERO" },
    { id: "staff-cocina", name: "Cocina", pin: "4321", role: "COCINA" },
  ];

  for (const s of staffSeed) {
    const hashed = await bcrypt.hash(s.pin, 10);
    await prisma.staff.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        branchId: branch.id,
        name: s.name,
        pin: hashed,
        role: s.role,
      },
    });
  }

  await prisma.table.upsert({
    where: { id: "table-1" },
    update: {},
    create: { id: "table-1", branchId: branch.id, label: "Mesa 1", seats: 4, status: "LIBRE" },
  });

  await prisma.orderNumberSequence.upsert({
    where: { branchId: branch.id },
    update: {},
    create: { branchId: branch.id, current: 0 },
  });

  console.log("Seed completed", { branch, categories: categories.length, extras: extras.count });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
