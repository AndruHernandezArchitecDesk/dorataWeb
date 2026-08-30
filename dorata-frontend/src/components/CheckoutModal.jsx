import { useState } from "react";
import { CreditCard, Banknote, Smartphone, X } from "lucide-react";
import { money } from "../data/menu";

const PAYMENT_OPTIONS = [
  { id: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "BILLETERA_DIGITAL", label: "Billetera digital", icon: Smartphone },
];

export default function CheckoutModal({ isOpen, onClose, total, onConfirm }) {
  const [method, setMethod] = useState("TARJETA");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(method);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper rounded-3xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-display text-charcoal">Confirmar pedido</div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream flex items-center justify-center"
          >
            <X size={16} className="text-charcoal" />
          </button>
        </div>

        <div className="bg-cream border border-line rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-xs label-font text-mute">TOTAL</div>
          <div className="text-2xl font-display text-flame">{money(total)}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs label-font text-charcoal">MÉTODO DE PAGO</div>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = method === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
                    active ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
                  }`}
                >
                  <opt.icon size={18} strokeWidth={2.2} />
                  <span className="text-sm font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full rounded-2xl py-4 bg-flame text-cream font-extrabold text-sm disabled:opacity-60"
        >
          {loading ? "Procesando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
