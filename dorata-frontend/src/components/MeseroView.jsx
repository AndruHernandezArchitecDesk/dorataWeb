import { useEffect, useState } from "react";
import { X, Send, CreditCard, CheckCircle2 } from "lucide-react";
import { getTables, getOrder, sendOrderToKitchen, payOrder, releaseOrder } from "../lib/api";
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

  const load = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openTable = async (t) => {
    if (!t.activeOrder) return;
    setSelected(t);
    setDetail(null);
    const order = await getOrder(t.activeOrder.id);
    setDetail(order);
  };

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn(selected.activeOrder.id);
      setSelected(null);
      setDetail(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-display text-charcoal">Mesas</div>
          <button onClick={onBack} className="text-sm font-bold text-mute underline">
            Volver al cliente
          </button>
        </div>

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
          <div className="absolute inset-0 bg-charcoal/40" onClick={() => setSelected(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-2xl flex flex-col rounded-l-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="text-lg font-display text-charcoal">{selected.label}</div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
                <X size={16} className="text-mute" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!detail ? (
                <div className="text-sm text-mute">Cargando pedido...</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {detail.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-sm border-b border-line pb-2">
                      <span className="text-ink">
                        {i.qty}x {i.productName}
                      </span>
                      <span className="font-bold text-charcoal">{money(Number(i.unitPrice) * i.qty)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-display text-charcoal mt-2">
                    <span>Total</span>
                    <span className="text-flame">{money(Number(detail.total))}</span>
                  </div>
                </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
