export const CATEGORIES = ["Combos", "Hamburguesas", "Papas", "Bebidas", "Postres"];

export const PRODUCTS = [
  { id: "c1", cat: "Combos", name: "Combo Clásico", price: 8.5, emoji: "🍔", tag: "Popular", desc: "Fuego Classic + papas + bebida.", hasExtras: true, hasSize: false },
  { id: "c2", cat: "Combos", name: "Combo Doble Fuego", price: 10.9, emoji: "🔥", tag: "Picante", desc: "Doble Queso + papas grandes + bebida.", hasExtras: true, hasSize: false },
  { id: "h1", cat: "Hamburguesas", name: "Fuego Classic", price: 5.5, emoji: "🍔", tag: null, desc: "Carne a la parrilla, queso, lechuga y salsa fuego.", hasExtras: true, hasSize: false },
  { id: "h2", cat: "Hamburguesas", name: "Doble Queso", price: 6.9, emoji: "🧀", tag: "Popular", desc: "Doble carne, doble queso cheddar fundido.", hasExtras: true, hasSize: false },
  { id: "h3", cat: "Hamburguesas", name: "Picante Jalapeño", price: 6.5, emoji: "🌶️", tag: "Picante", desc: "Jalapeños frescos, pepper jack y salsa chipotle.", hasExtras: true, hasSize: false },
  { id: "p1", cat: "Papas", name: "Papas Clásicas", price: 2.5, emoji: "🍟", tag: null, desc: "Cortadas a mano, crujientes por fuera.", hasExtras: false, hasSize: true },
  { id: "p2", cat: "Papas", name: "Papas con Queso", price: 3.9, emoji: "🧀", tag: null, desc: "Bañadas en queso cheddar y tocino.", hasExtras: false, hasSize: true },
  { id: "p3", cat: "Papas", name: "Aros de Cebolla", price: 3.2, emoji: "🧅", tag: null, desc: "Empanizado dorado, salsa ranch incluida.", hasExtras: false, hasSize: true },
  { id: "b1", cat: "Bebidas", name: "Refresco", price: 1.8, emoji: "🥤", tag: null, desc: "Cola, naranja o limón.", hasExtras: false, hasSize: true },
  { id: "b2", cat: "Bebidas", name: "Malteada Chocolate", price: 3.5, emoji: "🥤", tag: null, desc: "Cremosa, con crema batida.", hasExtras: false, hasSize: true },
  { id: "b3", cat: "Bebidas", name: "Agua", price: 1.2, emoji: "💧", tag: null, desc: "Botella 500ml.", hasExtras: false, hasSize: false },
  { id: "d1", cat: "Postres", name: "Volcán de Chocolate", price: 3.0, emoji: "🍫", tag: "Nuevo", desc: "Centro líquido, servido caliente.", hasExtras: false, hasSize: false },
  { id: "d2", cat: "Postres", name: "Helado Suave", price: 2.2, emoji: "🍦", tag: null, desc: "Vainilla o chocolate en cono.", hasExtras: false, hasSize: false },
];

export const EXTRAS = [
  { id: "e1", name: "Queso extra", price: 0.8 },
  { id: "e2", name: "Tocino", price: 1.2 },
  { id: "e3", name: "Aguacate", price: 1.0 },
  { id: "e4", name: "Doble carne", price: 2.5 },
  { id: "e5", name: "Sin cebolla", price: 0 },
  { id: "e6", name: "Extra picante", price: 0 },
];

export const SIZES = [
  { id: "sm", name: "Chica", delta: 0 },
  { id: "md", name: "Mediana", delta: 0.8 },
  { id: "lg", name: "Grande", delta: 1.5 },
];

export const ORDER_TYPES = [
  { value: "COMER_AQUI", label: "Comer aquí" },
  { value: "PARA_LLEVAR", label: "Para llevar" },
  { value: "DOMICILIO", label: "Domicilio", disabled: true, badge: "Próximamente" },
];

export const TAKEAWAY_FEE = 0.25;

export const BANK_INFO = {
  banco: "Banco del Pichincha",
  titular: "Dorata Cía. Ltda.",
  tipoCuenta: "Ahorros",
  numeroCuenta: "2200123456",
  ruc: "1791234567001",
  email: "pagos@dorata.ec",
  // Valor para QR (ejemplo): formato no transaccional, solo informativo
  qrPayload: "PICHINCHA|2200123456|1791234567001|Dorata",
};

export const money = (n) => `$${n.toFixed(2)}`;

// NOTA: este archivo hoy es la fuente de verdad del menú en el frontend.
// Cuando el backend exista, reemplazar por una llamada a GET /api/menu
// (ver src/lib/api.js) y dejar este archivo solo como fallback/mocks para
// desarrollo local o Storybook.
