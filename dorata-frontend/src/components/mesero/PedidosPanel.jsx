import { money } from "../../data/menu";

export default function PedidosPanel({ orders, loading, error, onOpenOrder }) {
  // Cola FIFO: más antiguo primero, solo sin mesa (COMER_AQUI sin asignar) y PARA_LLEVAR
  // Backend devuelve desc; aquí reordenamos asc
  const sorted = [...orders]
    .filter((o) => !o.tableId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-display text-charcoal">Pedidos – cola (más antiguo primero)</div>
        <span className="text-xs bg-paper border border-line rounded-full px-2.5 py-1 text-mute font-bold">
          {sorted.length} en cola
        </span>
      </div>

      {error && (
        <div className="bg-chile/10 border border-chile/20 rounded-2xl p-3 text-sm text-chile">
          Error al cargar pedidos: {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-mute">Cargando pedidos...</div>
      ) : sorted.length === 0 && !error ? (
        <div className="text-sm text-mute">No hay pedidos en cola. Los COMER_AQUI aparecerán aquí hasta asignar a mesa.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpenOrder(o)}
              className="bg-paper border border-line rounded-2xl p-4 text-left flex flex-col gap-2 hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-charcoal">#{o.orderNumber}</span>
                <span className="text-[10px] label-font text-mute">
                  {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {o.customerName && <div className="text-xs text-ink font-bold">{o.customerName}</div>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-mute">
                  {o.orderType === "COMER_AQUI"
                    ? "En local"
                    : o.orderType === "DOMICILIO"
                    ? "Domicilio"
                    : o.orderType === "PARA_LLEVAR"
                    ? "Para llevar"
                    : o.orderType}
                </span>
                <span className="text-sm font-extrabold text-flame">{money(Number(o.total))}</span>
              </div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] label-font w-fit ${
                  o.status === "ABIERTO"
                    ? "bg-yolk text-charcoal"
                    : o.status === "ENVIADO_COCINA"
                    ? "bg-flame text-cream"
                    : o.status === "PAGADO"
                    ? "bg-green text-cream"
                    : o.status === "LISTO"
                    ? "bg-green text-cream"
                    : "bg-paper text-mute border border-line"
                }`}
              >
                {o.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
