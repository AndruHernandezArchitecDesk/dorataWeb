import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getKitchenQueue, markOrderReady } from "../lib/api";
import { money } from "../data/menu";

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

  const markReady = async (id) => {
    setBusyId(id);
    try {
      await markOrderReady(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-display text-cream">Cocina</div>
          <button onClick={onBack} className="text-sm font-bold text-cream/70 underline">
            Volver al cliente
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="text-cream/60 text-sm">Sin pedidos en cocina.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {queue.map((o) => (
              <div key={o.id} className="bg-paper rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-display text-flame">#{o.orderNumber}</div>
                  <div className="text-[11px] font-bold text-mute uppercase">
                    {o.orderType}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">
                        {i.qty}x {i.productName}
                        {i.size ? ` (${i.size})` : ""}
                      </span>
                      <span className="text-mute">{money(Number(i.unitPrice) * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <button
                  disabled={busyId === o.id}
                  onClick={() => markReady(o.id)}
                  className="w-full rounded-2xl py-3 bg-green text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Listo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
