import { useEffect, useState } from "react";
import { X, Send, CreditCard, CheckCircle2, Plus, Trash2 } from "lucide-react";
import {
  getTables,
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
import { money } from "../data/menu";

const STATUS_STYLES = {
  LIBRE: "bg-paper text-mute border-line",
  PIDIENDO: "bg-yolk text-charcoal border-yolk",
  COCINA: "bg-flame text-cream border-flame",
  COMIENDO: "bg-green text-cream border-green",
};

const STATUS_LABEL = {
  LIBRE: "Libre",
  PIDIENDO: "Pidiendo",
  COCINA: "En cocina",
  COMIENDO: "Comiendo",
};

export default function MeseroView({ onBack }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const load = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async (orderId) => {
    const order = await getOrder(orderId);
    setDetail(order);
    return order;
  };

  const closeDrawer = () => {
    setSelected(null);
    setDetail(null);
    setMenuOpen(false);
    setMenu(null);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const openTable = async (t) => {
    setSelected(t);
    setDetail(null);
    setMenuOpen(false);
    if (t.activeOrder) {
      const order = await getOrder(t.activeOrder.id);
      setDetail(order);
    }
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
        setSelected({ ...selected, activeOrder: { id: order.id } });
        await refreshOrder(order.id);
      } else {
        const existing = detail?.items?.find(
          (i) => i.productId === product.id && (i.size || null) === null
        );
        if (existing) {
          await updateOrderItemQty(selected.activeOrder.id, existing.id, existing.qty + 1);
        } else {
          await addOrderItem(selected.activeOrder.id, product, 1);
        }
        await refreshOrder(selected.activeOrder.id);
      }
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
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn(selected.activeOrder.id);
      closeDrawer();
    } finally {
      setBusy(false);
    }
  };

  const removeTable = async () => {
    setDeleteBusy(true);
    try {
      await deleteTable(selected.id);
      closeDrawer();
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
          <div className="text-2xl font-display text-charcoal">Mesas</div>
          <div className="flex items-center gap-2">
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 bg-flame text-cream rounded-full pl-3 pr-3.5 py-2.5 font-bold text-sm"
              >
                <Plus size={16} /> Agregar mesa
              </button>
            )}
            <button onClick={onBack} className="text-sm font-bold text-mute underline">
              Volver al cliente
            </button>
          </div>
        </div>

        {adding && (
          <form onSubmit={addTable} className="flex items-center gap-2 mb-4">
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ej: Mesa 5"
              className="rounded-2xl bg-cream border border-line px-4 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-2xl py-2.5 px-4 bg-charcoal text-cream font-bold text-sm disabled:opacity-60"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewLabel(""); }}
              className="rounded-2xl py-2.5 px-3 bg-paper border border-line text-mute font-bold text-sm"
            >
              Cancelar
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-mute">Cargando mesas...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => openTable(t)}
                className={`rounded-2xl border p-4 text-left flex flex-col gap-2 ${
                  STATUS_STYLES[t.status] || "bg-paper text-ink border-line"
                }`}
              >
                <div className="text-lg font-display">{t.label}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                  {STATUS_LABEL[t.status] || t.status}
                </div>
                {t.activeOrder && (
                  <div className="text-xs font-bold">
                    #{t.activeOrder.orderNumber || "?"} · {money(Number(t.activeOrder.total))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-charcoal/40" onClick={closeDrawer} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-2xl flex flex-col rounded-l-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="text-lg font-display text-charcoal">{selected.label}</div>
              <button onClick={closeDrawer} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
                <X size={16} className="text-mute" />
              </button>
            </div>

            {menuOpen ? (
              <div className="flex flex-col h-full">
                <div className="px-5 pt-3 pb-2 border-b border-line">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-charcoal">Menú</div>
                    <button onClick={() => setMenuOpen(false)} className="text-xs font-bold text-mute underline">
                      Ver pedido
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {menu?.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setMenuCat(c.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
                          c.name === menuCat
                            ? "bg-charcoal text-cream border-charcoal"
                            : "bg-paper text-ink border-line"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-4 grid grid-cols-2 gap-2">
                  {menu?.find((c) => c.name === menuCat)?.products?.map((p) => (
                    <button
                      key={p.id}
                      disabled={busy}
                      onClick={() => handleAddProduct(p)}
                      className="bg-paper border border-line rounded-2xl p-3 flex flex-col gap-2 text-left hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                    >
                      <div className="w-full aspect-square rounded-xl bg-cream flex items-center justify-center text-4xl relative">
                        {p.emoji}
                        {p.tag && (
                          <span
                            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] label-font ${
                              p.tag === "Picante" ? "bg-chile text-cream" : "bg-yolk text-charcoal"
                            }`}
                          >
                            {p.tag.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-charcoal leading-tight">{p.name}</div>
                      <div className="text-sm font-extrabold text-flame">{money(Number(p.price))}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                  <button
                    onClick={openMenu}
                    className="w-full rounded-2xl py-3 bg-charcoal text-cream font-extrabold text-sm"
                  >
                    + Agregar productos
                  </button>

                  {selected.activeOrder && !detail ? (
                    <div className="text-sm text-mute">Cargando pedido...</div>
                  ) : !selected.activeOrder ? (
                    <div className="text-sm text-mute">Sin pedido activo.</div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        {detail.items.map((i) => (
                          <div key={i.id} className="flex items-center justify-between text-sm border-b border-line pb-2">
                            <span className="text-ink">
                              {i.qty}x {i.productName}
                            </span>
                            <span className="font-bold text-charcoal">{money(Number(i.unitPrice) * i.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-base font-display text-charcoal mt-1">
                        <span>Total</span>
                        <span className="text-flame">{money(Number(detail.total))}</span>
                      </div>
                    </>
                  )}
                </div>

                {detail && (
                  <div className="px-5 pb-6 pt-4 border-t border-line flex flex-col gap-2">
                    <button
                      disabled={busy}
                      onClick={() => act(sendOrderToKitchen)}
                      className="w-full rounded-2xl py-3.5 bg-charcoal text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Send size={16} /> Enviar a cocina
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(payOrder)}
                      className="w-full rounded-2xl py-3.5 bg-flame text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <CreditCard size={16} /> Cobrar
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(releaseOrder)}
                      className="w-full rounded-2xl py-3.5 bg-paper text-ink border border-line font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} /> Liberar mesa
                    </button>
                  </div>
                )}

                {!selected.activeOrder && (
                  <div className="px-5 pb-6 pt-4 border-t border-line">
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs font-bold text-mute underline flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Eliminar mesa
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

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
