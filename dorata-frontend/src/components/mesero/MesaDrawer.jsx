import { X, Send, CreditCard, CheckCircle2, Trash2, UtensilsCrossed } from "lucide-react";
import { money } from "../../data/menu";

const ORDER_LABEL = {
  ABIERTO: "Pidiendo",
  ENVIADO_COCINA: "En cocina",
  PREPARANDO: "Preparando",
  PAGADO: "Pagado",
  LISTO: "Listo para servir",
  ENTREGADO: "Servido",
};

export default function MesaDrawer({
  selected,
  detail,
  menuOpen,
  menu,
  menuCat,
  busy,
  pendingOrders = [],
  onClose,
  onOpenMenu,
  onCloseMenu,
  onSelectMenuCat,
  onAddProduct,
  onAssignOrder,
  onSendKitchen,
  onPay,
  onServed,
  onRelease,
  onConfirmDelete,
}) {
  const assignable = pendingOrders
    .filter((o) => !o.tableId && o.orderType === "COMER_AQUI" && o.status === "ABIERTO")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
                      {detail.orderNumber && (
                        <div className="inline-flex items-center gap-1.5 bg-cream border border-line rounded-full px-3 py-1 w-fit">
                          <span className="text-[11px] font-bold text-mute uppercase">Estado:</span>
                          <span className="text-xs font-extrabold text-charcoal">{ORDER_LABEL[detail.status] || detail.status}</span>
                          {detail.status === "PREPARANDO" && <span className="w-2 h-2 rounded-full bg-yolk animate-pulse" />}
                          {detail.status === "LISTO" && <span className="w-2 h-2 rounded-full bg-green" />}
                        </div>
                      )}
                      <div className="flex flex-col gap-2 mt-2">
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
                      {detail.status === "PREPARANDO" && (
                        <div className="text-center text-xs font-bold text-charcoal mt-2 py-2 bg-yolk/20 rounded-xl border border-yolk">Preparando en cocina…</div>
                      )}
                      {detail.status === "LISTO" && (
                        <div className="text-center text-sm font-extrabold text-green mt-2 py-2 bg-green/10 rounded-xl">Listo para servir</div>
                      )}
                      {detail.status === "ENTREGADO" && (
                        <div className="text-center text-sm font-extrabold text-green mt-2 py-2 bg-green/10 rounded-xl">Servido</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-mute">Cargando pedido...</div>
                  )}
                </>
              ) : (
                <>
                  {assignable.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-bold text-charcoal">Asignar pedido de cliente (más antiguo primero)</div>
                      <div className="text-xs text-mute">El cliente eligió COMER_AQUI sin mesa. Selecciona un pedido para asignarlo a {selected.label}.</div>
                      <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
                        {assignable.map((o) => (
                          <button
                            key={o.id}
                            disabled={busy}
                            onClick={() => onAssignOrder(o.id)}
                            className="text-left bg-cream border border-line rounded-2xl p-3 hover:border-charcoal transition-colors disabled:opacity-60"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-charcoal">#{o.orderNumber} {o.customerName ? `· ${o.customerName}` : ""}</span>
                              <span className="text-xs text-mute">{new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <div className="text-xs text-mute mt-1">
                              {o.items?.length || 0} ítems · {money(Number(o.total))} · {o.orderType}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-mute text-center">— o —</div>
                    </div>
                  ) : (
                    <div className="bg-cream border border-dashed border-line rounded-2xl p-3 text-sm text-mute text-center">
                      No hay pedidos COMER_AQUI sin mesa en cola.
                    </div>
                  )}
                  <button onClick={onOpenMenu} className="w-full rounded-2xl py-3 bg-charcoal text-cream font-extrabold text-sm">
                    + Agregar productos (crear pedido directo en mesa)
                  </button>
                </>
              )}
            </div>

            {detail && selected.activeOrder && (
              <div className="px-5 pb-6 pt-4 border-t border-line flex flex-col gap-2">
                {detail.status === "ABIERTO" && (
                  <button
                    disabled={busy}
                    onClick={onSendKitchen}
                    className="w-full rounded-2xl py-3.5 bg-charcoal text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Send size={16} /> Enviar a cocina
                  </button>
                )}
                {detail.status === "LISTO" && (
                  <button
                    disabled={busy}
                    onClick={onServed}
                    className="w-full rounded-2xl py-3.5 bg-green text-cream font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <UtensilsCrossed size={16} /> Servido
                  </button>
                )}
                {detail?.status !== "PAGADO" && detail?.status !== "ENTREGADO" && (
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
