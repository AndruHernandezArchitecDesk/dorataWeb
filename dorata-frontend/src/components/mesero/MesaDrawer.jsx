import { X, Send, CreditCard, CheckCircle2, Trash2 } from "lucide-react";
import { money } from "../../data/menu";

export default function MesaDrawer({
  selected,
  detail,
  menuOpen,
  menu,
  menuCat,
  busy,
  onClose,
  onOpenMenu,
  onCloseMenu,
  onSelectMenuCat,
  onAddProduct,
  onSendKitchen,
  onPay,
  onRelease,
  onConfirmDelete,
}) {
  if (!selected) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-paper shadow-2xl flex flex-col rounded-l-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="text-lg font-display text-charcoal">{selected.label}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
            <X size={16} className="text-mute" />
          </button>
        </div>

        {menuOpen ? (
          <div className="flex flex-col h-full">
            <div className="px-5 pt-3 pb-2 border-b border-line">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-charcoal">Menú</div>
                <button onClick={onCloseMenu} className="text-xs font-bold text-mute underline">
                  Ver pedido
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {menu?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectMenuCat(c.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
                      c.name === menuCat ? "bg-charcoal text-cream border-charcoal" : "bg-paper text-ink border-line"
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
                  onClick={() => onAddProduct(p)}
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
              {selected.activeOrder ? (
                <>
                  <button onClick={onOpenMenu} className="w-full rounded-2xl py-3 bg-charcoal text-cream font-extrabold text-sm">
                    + Agregar productos
                  </button>
                  {detail ? (
                    <>
                      {detail.orderNumber && <div className="text-xs font-bold text-mute mb-2">Pedido #{detail.orderNumber}</div>}
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
                      {detail.status === "PAGADO" && (
                        <div className="text-center text-sm font-extrabold text-green mt-2 py-2 bg-green/10 rounded-xl">Cobrado</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-mute">Cargando pedido...</div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-sm text-mute mb-3">Mesa libre. Para iniciar un pedido, agregue productos.</div>
                  <button onClick={onOpenMenu} className="w-full rounded-2xl py-3 bg-charcoal text-cream font-extrabold text-sm">
                    + Agregar productos
                  </button>
                </>
              )}
            </div>

            {detail && selected.activeOrder && (
              <div className="px-5 pb-6 pt-4 border-t border-line flex flex-col gap-2">
                <button
                  disabled={busy}
                  onClick={onSendKitchen}
                  className="w-full rounded-2xl py-3.5 bg-charcoal text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send size={16} /> Enviar a cocina
                </button>
                {detail?.status !== "PAGADO" && (
                  <button
                    disabled={busy}
                    onClick={onPay}
                    className="w-full rounded-2xl py-3.5 bg-flame text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <CreditCard size={16} /> Cobrar
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={onRelease}
                  className="w-full rounded-2xl py-3.5 bg-paper text-ink border border-line font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Liberar mesa
                </button>
              </div>
            )}

            {!selected.activeOrder && (
              <div className="px-5 pb-6 pt-4 border-t border-line">
                <button
                  onClick={onConfirmDelete}
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
  );
}
