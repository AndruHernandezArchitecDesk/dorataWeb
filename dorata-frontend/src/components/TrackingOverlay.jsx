import { useEffect, useState } from "react";
import { ClipboardList, ChefHat, CheckCircle2 } from "lucide-react";
import { subscribeToOrderStatus } from "../lib/api";
import { money } from "../data/menu";

const STAGES = [
  { id: 0, label: "Recibido", icon: ClipboardList },
  { id: 1, label: "Preparando", icon: ChefHat },
  { id: 2, label: "Listo para recoger", icon: CheckCircle2 },
];

export default function TrackingOverlay({ isOpen, orderNumber, cart, onNewOrder }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!isOpen || !orderNumber) return;
    setStage(0);
    const unsubscribe = subscribeToOrderStatus(orderNumber, (nextStage) => {
      setStage(nextStage);
    });
    return unsubscribe;
  }, [isOpen, orderNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-5 py-8 flex flex-col gap-8 h-full overflow-y-auto">
        <div className="text-center">
          <div className="text-xs label-font text-mute mb-1">ORDEN</div>
          <div className="text-3xl font-display text-charcoal">#{orderNumber}</div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {STAGES.map((s, idx) => {
            const active = stage >= s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors">
                  <Icon
                    size={22}
                    className={active ? "text-green" : "text-mute"}
                    strokeWidth={active ? 3 : 2}
                  />
                </div>
                <div className={`text-xs font-bold text-center ${active ? "text-charcoal" : "text-mute"}`}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 h-1.5 w-full rounded-full bg-line overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-all duration-500"
            style={{ width: `${(stage / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        <div className="bg-paper border border-line rounded-3xl p-5 flex flex-col gap-3">
          <div className="text-xs label-font text-mute">RESUMEN</div>
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <div key={item.cartId} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {item.qty}x {item.product.name}
                </span>
                <span className="font-bold text-charcoal">{money(item.unitPrice * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3 flex justify-between text-sm font-bold text-charcoal">
            <span>Total</span>
            <span className="text-flame">
              {money(
                cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0) *
                  1.08
              )
                .replace("$", "$")
                .replace(/\d+\.\d{2}/, (m) => m)}
            </span>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          className="w-full rounded-2xl py-4 bg-charcoal text-cream font-extrabold text-sm"
        >
          Hacer otro pedido
        </button>
      </div>
    </div>
  );
}
