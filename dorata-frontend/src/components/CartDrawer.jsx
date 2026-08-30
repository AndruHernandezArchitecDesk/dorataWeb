import { Trash2 } from "lucide-react";
import { money, ORDER_TYPES } from "../data/menu";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQty,
  removeItem,
  orderType,
  setOrderType,
  subtotal,
  tax,
  total,
  onCheckout,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-2xl flex flex-col rounded-l-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="text-lg font-display text-charcoal">Tu pedido</div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream flex items-center justify-center"
          >
            <Trash2 size={16} className="text-mute" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-line">
          <div className="text-[11px] label-font text-mute mb-2">TIPO DE PEDIDO</div>
          <div className="flex gap-2 overflow-x-auto">
            {ORDER_TYPES.map((type) => {
              const active = orderType === type;
              return (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-colors ${
                    active ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-3">🛒</div>
              <div className="text-sm font-bold text-charcoal">Tu carrito está vacío</div>
              <div className="text-xs text-mute mt-1">Agrega productos para continuar</div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div key={item.cartId} className="bg-cream border border-line rounded-2xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-charcoal leading-tight">{item.product.name}</div>
                    <div className="text-xs text-mute mt-0.5">
                      {item.size && `${item.size} · `}
                      {item.extras?.length > 0 && `${item.extras.length} extras`}
                    </div>
                    <div className="text-sm font-extrabold text-flame mt-1">
                      {money(item.unitPrice * item.qty)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.cartId)}
                    className="w-8 h-8 rounded-full bg-paper border border-line flex items-center justify-center flex-shrink-0"
                  >
                    <Trash2 size={14} className="text-mute" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.cartId, -1)}
                      className="w-8 h-8 rounded-full bg-paper border border-line flex items-center justify-center"
                    >
                      <span className="text-charcoal text-sm font-bold">−</span>
                    </button>
                    <span className="text-sm font-extrabold w-4 text-center text-charcoal">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.cartId, 1)}
                      className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center"
                    >
                      <span className="text-cream text-sm font-bold">+</span>
                    </button>
                  </div>
                  <div className="text-xs text-mute">x{item.qty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="px-5 pb-6 pt-4 border-t border-line">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-sm text-mute">
                <span>Subtotal</span>
                <span className="font-bold text-charcoal">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-mute">
                <span>Impuesto</span>
                <span className="font-bold text-charcoal">{money(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-display text-charcoal">
                <span>Total</span>
                <span className="text-flame">{money(total)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full rounded-2xl py-4 bg-flame text-cream font-extrabold text-sm"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
