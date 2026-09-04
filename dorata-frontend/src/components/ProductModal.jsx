import { useState } from "react";
import { Check, ChevronLeft, Minus, Plus, X } from "lucide-react";
import { EXTRAS, SIZES, money } from "../data/menu";

export default function ProductModal({ product, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(SIZES[0].id);
  const [extras, setExtras] = useState([]);

  const toggleExtra = (id) =>
    setExtras((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  const sizeDelta = product.hasSize ? SIZES.find((s) => s.id === size).delta : 0;
  const extrasSum = extras.reduce((s, id) => s + EXTRAS.find((e) => e.id === id).price, 0);
  const unitPrice = product.price + sizeDelta + extrasSum;

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-paper rounded-t-3xl sm:rounded-3xl flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
            <ChevronLeft size={18} className="text-charcoal" />
          </button>
          <span className="text-xs font-bold text-mute">{product.cat}</span>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
            <X size={15} className="text-charcoal" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="w-full aspect-[8/5] sm:aspect-square rounded-3xl bg-cream flex items-center justify-center text-6xl sm:text-7xl mb-4 overflow-hidden relative">
            <span className="text-6xl sm:text-7xl">{product.emoji}</span>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>
          <div className="text-2xl font-display text-charcoal">{product.name}</div>
          <p className="text-sm text-mute mt-1.5 leading-relaxed">{product.desc}</p>

          {product.hasSize && (
            <div className="mt-5">
              <div className="text-xs label-font text-charcoal mb-2">TAMAÑO</div>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border ${
                      size === s.id ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
                    }`}
                  >
                    {s.name}
                    {s.delta > 0 ? ` +${money(s.delta)}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.hasExtras && (
            <div className="mt-5">
              <div className="text-xs label-font text-charcoal mb-2">EXTRAS</div>
              <div className="flex flex-col gap-2">
                {EXTRAS.map((e) => {
                  const checked = extras.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExtra(e.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-cream border ${
                        checked ? "border-flame" : "border-line"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            checked ? "bg-flame border-flame" : "border-mute"
                          }`}
                        >
                          {checked && <Check size={13} strokeWidth={3} className="text-cream" />}
                        </span>
                        <span className="text-sm font-semibold text-ink">{e.name}</span>
                      </span>
                      <span className="text-xs font-bold text-mute">
                        {e.price > 0 ? `+${money(e.price)}` : "Gratis"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs label-font text-charcoal">CANTIDAD</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-cream border border-line flex items-center justify-center"
              >
                <Minus size={14} className="text-charcoal" />
              </button>
              <span className="text-base font-extrabold w-4 text-center text-charcoal">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center"
              >
                <Plus size={14} className="text-cream" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-2 mt-auto">
          <button
            onClick={() => onAdd({ product, qty, size, extras, unitPrice })}
            className="w-full rounded-2xl py-4 bg-flame text-cream font-extrabold text-sm"
          >
            Agregar · {money(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
