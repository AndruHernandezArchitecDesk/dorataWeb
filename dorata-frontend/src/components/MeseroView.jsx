import { useEffect, useState } from "react";
import {
  getTables,
  getOrders,
  getOrder,
  getMenu,
  createTable,
  deleteTable,
  createOrderForTable,
  addOrderItem,
  updateOrderItemQty,
  sendOrderToKitchen,
  payOrder,
  releaseOrder,
} from "../lib/api";
import ProductAdmin from "./ProductAdmin";
import MesasPanel from "./mesero/MesasPanel";
import PedidosPanel from "./mesero/PedidosPanel";
import MesaDrawer from "./mesero/MesaDrawer";
import PedidoDrawer from "./mesero/PedidoDrawer";

// --- Lógica Mesa (estado/tablas) aislada de pedidos cliente ---
function useMesas() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getTables();
      setTables(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { tables, loading, error, load, setTables };
}

function usePedidosCliente() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.filter((o) => ["ABIERTO", "ENVIADO_COCINA", "PAGADO", "LISTO"].includes(o.status)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, load, setOrders };
}

export default function MeseroView({ onBack }) {
  // Mesas
  const mesas = useMesas();
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [menuCat, setMenuCat] = useState(null);

  // Pedidos cliente (sin mesa)
  const pedidos = usePedidosCliente();
  const [orderView, setOrderView] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderBusy, setOrderBusy] = useState(false);

  const [mode, setMode] = useState("tables");

  const refreshOrder = async (orderId, forMesa = true) => {
    const order = await getOrder(orderId);
    if (forMesa) setDetail(order);
    else setOrderDetail(order);
    return order;
  };

  const closeMesaDrawer = () => {
    setSelected(null);
    setDetail(null);
    setMenuOpen(false);
    setMenu(null);
    mesas.load();
    pedidos.load();
  };

  const closePedidoDrawer = () => {
    setOrderView(null);
    setOrderDetail(null);
    pedidos.load();
    mesas.load();
  };

  useEffect(() => {
    mesas.load();
    pedidos.load();
  }, []);

  const openTable = async (t) => {
    setSelected(t);
    setDetail(null);
    setOrderView(null);
    setOrderDetail(null);
    setMenuOpen(false);
    if (t.activeOrder) {
      try {
        const order = await getOrder(t.activeOrder.id);
        setDetail(order);
      } catch (e) {
        // si falla detalle, mantener selected abierto con error silencioso
      }
    }
  };

  const openOrder = async (o) => {
    setOrderView(o);
    setOrderDetail(o);
    setSelected(null);
    setDetail(null);
    setMenuOpen(false);
    try {
      const full = await getOrder(o.id);
      setOrderDetail(full);
    } catch {}
  };

  const openMenu = async () => {
    if (!menu) {
      const m = await getMenu();
      setMenu(m);
      setMenuCat(m[0]?.name);
    }
    setMenuOpen(true);
  };

  const handleAddProduct = async (product) => {
    setBusy(true);
    try {
      if (!selected.activeOrder) {
        const order = await createOrderForTable(selected.id, product);
        setSelected({ ...selected, activeOrder: order });
        setDetail(order);
        await mesas.load();
      } else {
        const existing = detail?.items?.find((i) => i.productId === product.id && (i.size || null) === null);
        if (existing) {
          await updateOrderItemQty(selected.activeOrder.id, existing.id, existing.qty + 1);
        } else {
          await addOrderItem(selected.activeOrder.id, product, 1);
        }
        await refreshOrder(selected.activeOrder.id, true);
        await mesas.load();
      }
      setMenuOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addTable = async (e) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    try {
      await createTable(label);
      setNewLabel("");
      setAdding(false);
      await mesas.load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const actMesa = async (fn, opts = {}) => {
    const close = opts.close !== false;
    const orderId = opts.orderId || selected.activeOrder?.id;
    setBusy(true);
    try {
      const updated = await fn(orderId);
      if (updated && typeof updated === "object") {
        setDetail(updated);
        if (selected?.activeOrder) setSelected((s) => ({ ...s, activeOrder: updated }));
      }
      if (close) closeMesaDrawer();
      else {
        await mesas.load();
        if (orderId) await refreshOrder(orderId, true);
      }
    } finally {
      setBusy(false);
    }
  };

  const actPedido = async (fn, orderId, close = false) => {
    setOrderBusy(true);
    try {
      const updated = await fn(orderId);
      if (updated && typeof updated === "object") setOrderDetail(updated);
      if (close) closePedidoDrawer();
      else {
        await pedidos.load();
        if (orderId) await refreshOrder(orderId, false);
      }
    } finally {
      setOrderBusy(false);
    }
  };

  const removeTable = async () => {
    setDeleteBusy(true);
    try {
      await deleteTable(selected.id);
      closeMesaDrawer();
      setConfirmDelete(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("tables")}
              className={`px-4 py-2 rounded-full text-sm font-bold border ${
                mode === "tables" ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
              }`}
            >
              Mesas
            </button>
            <button
              onClick={() => setMode("products")}
              className={`px-4 py-2 rounded-full text-sm font-bold border ${
                mode === "products" ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
              }`}
            >
              Productos
            </button>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-mute underline">
            Volver al cliente
          </button>
        </div>

        {mode === "products" && <ProductAdmin />}

        {mode === "tables" && (
          <>
            <MesasPanel
              tables={mesas.tables}
              loading={mesas.loading}
              error={mesas.error}
              adding={adding}
              newLabel={newLabel}
              busy={busy}
              onChangeNewLabel={setNewLabel}
              onStartAdding={() => setAdding(true)}
              onCancelAdding={() => {
                setAdding(false);
                setNewLabel("");
              }}
              onSubmitAdd={addTable}
              onOpenTable={openTable}
            />
            <PedidosPanel
              orders={pedidos.orders}
              loading={pedidos.loading}
              error={pedidos.error}
              onOpenOrder={openOrder}
            />
          </>
        )}
      </div>

      <MesaDrawer
        selected={selected}
        detail={detail}
        menuOpen={menuOpen}
        menu={menu}
        menuCat={menuCat}
        busy={busy}
        onClose={closeMesaDrawer}
        onOpenMenu={openMenu}
        onCloseMenu={() => setMenuOpen(false)}
        onSelectMenuCat={setMenuCat}
        onAddProduct={handleAddProduct}
        onSendKitchen={() => actMesa(sendOrderToKitchen)}
        onPay={() => actMesa(payOrder, { close: false })}
        onRelease={() => actMesa(releaseOrder)}
        onConfirmDelete={() => setConfirmDelete(true)}
      />

      <PedidoDrawer
        order={orderView}
        detail={orderDetail}
        busy={orderBusy}
        onClose={closePedidoDrawer}
        onSendKitchen={(id) => actPedido(sendOrderToKitchen, id, false)}
        onPay={(id) => actPedido(payOrder, id, false)}
        onRelease={(id) => actPedido(releaseOrder, id, true)}
      />

      {confirmDelete && selected && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-paper rounded-3xl p-5">
            <div className="text-base font-display text-charcoal mb-2">Eliminar {selected.label}</div>
            <div className="text-sm text-mute mb-4">Esta acción no se puede deshacer.</div>
            <div className="flex flex-col gap-2">
              <button
                disabled={deleteBusy}
                onClick={removeTable}
                className="w-full rounded-2xl py-3 bg-chile text-cream font-extrabold text-sm disabled:opacity-60"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full rounded-2xl py-3 bg-paper border border-line text-ink font-bold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
