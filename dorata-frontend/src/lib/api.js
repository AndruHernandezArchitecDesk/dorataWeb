import { io } from "socket.io-client";

// En dev, vacío => URLs relativas, y Vite las proxiea al backend (vite.config.js).
// En prod, setear VITE_API_URL al origen real del backend.
const API_URL = import.meta.env.VITE_API_URL || "";

let authToken = null; // token de mesa (cliente)
let staffToken = null; // token de staff (mesero/cocina/caja/admin)

export function setAuthToken(token) {
  authToken = token;
}

export function setStaffToken(token) {
  staffToken = token;
}

async function request(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error en la solicitud" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const clientRequest = (path, options) => request(path, options, authToken);
const staffRequest = (path, options) => request(path, options, staffToken);

export async function getMesaToken(tableId, branchId) {
  const res = await fetch(`${API_URL}/api/mesa/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableId, branchId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "No se pudo obtener el token de mesa");
  }
  const data = await res.json();
  return data.token;
}

export async function staffLogin(pin) {
  const data = await request("/api/staff/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
  setStaffToken(data.token);
  localStorage.setItem("dorata_staff_token", data.token);
  return data.staff;
}

export async function getMenu() {
  return clientRequest("/api/menu?branchId=branch-main");
}

export async function getTables() {
  return staffRequest("/api/tables?branchId=branch-main");
}

export async function deleteTable(id) {
  return staffRequest(`/api/tables/${id}`, { method: "DELETE" });
}

export async function createTable(label, seats = 4) {
  return staffRequest("/api/tables", {
    method: "POST",
    body: JSON.stringify({ label, seats }),
  });
}

export async function createOrderForTable(tableId, product) {
  const body = {
    items: [
      {
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.price),
        qty: 1,
        size: null,
        extras: null,
      },
    ],
    orderType: "COMER_AQUI",
    tableId,
  };

  const data = await staffRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return data;
}

export async function addOrderItem(orderId, product, qty = 1) {
  return staffRequest(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    body: JSON.stringify({ items: [{ productId: product.id, qty }] }),
  });
}

export async function updateOrderItemQty(orderId, cartId, qty) {
  return staffRequest(`/api/orders/${orderId}/items`, {
    method: "PATCH",
    body: JSON.stringify({ items: [{ cartId, qty }] }),
  });
}

export async function getOrder(id) {
  return staffRequest(`/api/orders/${id}`);
}

export async function createOrder({ cart, orderType, paymentMethod, customerName }) {
  const body = {
    items: cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.unitPrice,
      qty: item.qty,
      size: item.size || null,
      extras: item.extras || null,
    })),
    orderType: (orderType || "COMER_AQUI").toUpperCase(),
    paymentMethod,
    customerName: customerName || undefined,
  };

  const data = await clientRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return { orderId: data.id, orderNumber: data.orderNumber };
}

export async function sendOrderToKitchen(id) {
  return staffRequest(`/api/orders/${id}/send-kitchen`, { method: "POST" });
}

export async function payOrder(id) {
  return staffRequest(`/api/orders/${id}/pay`, { method: "POST" });
}

export async function markOrderReady(id) {
  return staffRequest(`/api/orders/${id}/ready`, { method: "POST" });
}

export async function releaseOrder(id) {
  return staffRequest(`/api/orders/${id}/release`, { method: "POST" });
}

export async function getKitchenQueue() {
  return staffRequest("/api/kitchen/queue?branchId=branch-main");
}

export async function getOrders(status) {
  const qs = status ? `?status=${status}` : "";
  return staffRequest(`/api/orders${qs}`);
}

export function subscribeToOrderStatus(orderId, onUpdate) {
  const socket = io(API_URL || undefined, {
    auth: authToken ? { token: authToken } : undefined,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    socket.emit("subscribe:order", orderId);
  });

  socket.on("order:updated", (data) => {
    const statusMap = {
      ABIERTO: 0,
      ENVIADO_COCINA: 0,
      PAGADO: 1,
      LISTO: 2,
      ENTREGADO: 2,
    };
    onUpdate(statusMap[data.data?.status || data.status] ?? 0);
  });

  socket.on("order:paid", () => onUpdate(1));
  socket.on("order:ready", () => onUpdate(2));

  return () => {
    socket.emit("unsubscribe:order", orderId);
    socket.disconnect();
  };
}

export async function getProducts() {
  return staffRequest("/api/products?branchId=branch-main");
}

export async function getCategories() {
  return staffRequest("/api/categories");
}

export async function createProduct(payload) {
  return staffRequest("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id, payload) {
  return staffRequest(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id) {
  return staffRequest(`/api/products/${id}`, { method: "DELETE" });
}

export async function createCategory(name) {
  return staffRequest("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
