import { X, Send, CreditCard, CheckCircle2 } from "lucide-react";
import { money } from "../../data/menu";

export default function PedidoDrawer({ order, detail, busy, onClose, onSendKitchen, onPay, onRelease }) {
  if (!order) return null;
  const d = detail || order;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-2xl flex flex-col rounded-l-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="text-lg font-display text-charcoal">{d.customerName || "Pedido #" + d.orderNumber}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
            <X size={16} className="text-mute" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-mute">
            Pedido #{d.orderNumber} · {new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
            {d.orderType === "PARA_LLEVAR" ? "Para llevar" : d.orderType}
          </div>
          {d.customerName && <div className="text-sm font-bold text-charcoal">{d.customerName}</div>}
          <div className="flex flex-col gap-2">
            {d.items?.map((i) => (
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
            <span className="text-flame">{money(Number(d.total))}</span>
          </div>
          {d.status === "PAGADO" && (
            <div className="text-center text-sm font-extrabold text-green mt-2 py-2 bg-green/10 rounded-xl">Cobrado</div>
          )}
        </div>

        <div className="px-5 pb-6 pt-4 border-t border-line flex flex-col gap-2">
          <button
            disabled={busy}
            onClick={() => onSendKitchen(d.id)}
            className="w-full rounded-2xl py-3.5 bg-charcoal text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={16} /> Enviar a cocina
          </button>
          {d.status !== "PAGADO" && (
            <button
              disabled={busy}
              onClick={() => onPay(d.id)}
              className="w-full rounded-2xl py-3.5 bg-flame text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CreditCard size={16} /> Cobrar
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => onRelease(d.id)}
            className="w-full rounded-2xl py-3.5 bg-paper text-ink border border-line font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 size={16} /> Entregado / Liberar
          </button>
        </div>
      </div>
    </div>
  );
}
