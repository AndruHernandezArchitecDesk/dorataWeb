import { useEffect, useState } from "react";
import { Clock, CheckCircle2, ChefHat } from "lucide-react";
import { getKitchenQueue, markOrderPreparing, markOrderReady } from "../lib/api";
import { money } from "../data/menu";

function OrderCard({ order, busy, onPreparando, onListo }) {
  const isPreparing = order.status === "PREPARANDO";
  const isEnviado = order.status === "ENVIADO_COCINA";
  return (
    <div className={`bg-paper rounded-2xl p-4 flex flex-col gap-3 border-2 ${isPreparing ? "border-yolk" : "border-transparent"}`}>
      <div className="flex items-center justify-between">
        <div className="text-xl font-display text-flame">#{order.orderNumber}</div>
        <div className="flex flex-col items-end">
          <div className="text-[11px] font-bold text-mute uppercase">
            {order.orderType === "COMER_AQUI" ? "Mesa" : order.orderType === "PARA_LLEVAR" ? "Para llevar" : order.orderType}
            {order.table ? ` · ${order.table.label}` : ""}
          </div>
          <div className="text-[10px] text-mute">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
      {order.customerName && <div className="text-xs font-bold text-charcoal">{order.customerName}</div>}
      <div className="flex flex-col gap-1.5">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm">
            <span className="text-ink">
              {i.qty}x {i.productName}
              {i.size ? ` (${i.size})` : ""}
            </span>
            <span className="text-mute">{money(Number(i.unitPrice) * i.qty)}</span>
          </div>
        ))}
      </div>
      {isPreparing && <div className="text-xs font-bold text-yolk bg-yolk/20 rounded-xl px-2 py-1 text-center">Preparando…</div>}
      <div className="flex gap-2">
        <button
          disabled={busy === order.id || !isEnviado}
          onClick={() => onPreparando(order.id)}
          className={`flex-1 rounded-2xl py-3 font-extrabold text-sm flex items-center justify-center gap-2 border disabled:opacity-60 ${
            isPreparing ? "bg-yolk text-charcoal border-yolk" : isEnviado ? "bg-cream text-charcoal border-line hover:border-yolk" : "bg-cream text-mute border-line"
          }`}
        >
          <Clock size={16} /> {isPreparing ? "En preparación" : "Preparando"}
        </button>
        <button
          disabled={busy === order.id}
          onClick={() => onListo(order.id)}
          className="flex-1 rounded-2xl py-3 bg-green text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <CheckCircle2 size={16} /> Listo
        </button>
      </div>
    </div>
  );
}

export default function CocinaView({ onBack }) {
  const [queue, setQueue] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const data = await getKitchenQueue();
      setQueue(data);
    } catch {
      // ignore; next poll retries
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const handlePreparando = async (id) => {
    setBusyId(id);
    try {
      await markOrderPreparing(id);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleListo = async (id) => {
    setBusyId(id);
    try {
      await markOrderReady(id);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const mesaOrders = queue.filter((o) => o.tableId || o.orderType === "COMER_AQUI");
  const llevarOrders = queue.filter((o) => o.orderType === "PARA_LLEVAR");

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-display text-cream flex items-center gap-2">
            <ChefHat size={24} /> Cocina
          </div>
          <button onClick={onBack} className="text-sm font-bold text-cream/70 underline">
            Volver
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="text-cream/60 text-sm">Sin pedidos en cocina.</div>
        ) : (
          <div className="flex flex-col gap-8">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-display text-cream">Pedidos de mesa</h2>
                <span className="text-xs bg-paper/20 text-cream rounded-full px-2 py-0.5">{mesaOrders.length}</span>
              </div>
              {mesaOrders.length === 0 ? (
                <div className="text-cream/60 text-sm">Sin pedidos de mesa.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mesaOrders.map((o) => (
                    <OrderCard key={o.id} order={o} busy={busyId} onPreparando={handlePreparando} onListo={handleListo} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-display text-cream">Para llevar</h2>
                <span className="text-xs bg-paper/20 text-cream rounded-full px-2 py-0.5">{llevarOrders.length}</span>
              </div>
              {llevarOrders.length === 0 ? (
                <div className="text-cream/60 text-sm">Sin pedidos para llevar.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {llevarOrders.map((o) => (
                    <OrderCard key={o.id} order={o} busy={busyId} onPreparando={handlePreparando} onListo={handleListo} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
