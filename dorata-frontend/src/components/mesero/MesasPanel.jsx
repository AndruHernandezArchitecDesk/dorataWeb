import { Plus } from "lucide-react";
import { money } from "../../data/menu";

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

export default function MesasPanel({
  tables,
  loading,
  error,
  adding,
  newLabel,
  busy,
  onChangeNewLabel,
  onStartAdding,
  onCancelAdding,
  onSubmitAdd,
  onOpenTable,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-display text-charcoal">Mesas</div>
        {!adding && (
          <button
            onClick={onStartAdding}
            className="flex items-center gap-1.5 bg-flame text-cream rounded-full pl-3 pr-3.5 py-2.5 font-bold text-sm"
          >
            <Plus size={16} /> Agregar mesa
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={onSubmitAdd} className="flex items-center gap-2 mb-1">
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => onChangeNewLabel(e.target.value)}
            placeholder="Ej: Mesa 5"
            className="rounded-2xl bg-cream border border-line px-4 py-2.5 text-sm text-charcoal outline-none focus:border-flame"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl py-2.5 px-4 bg-charcoal text-cream font-bold text-sm disabled:opacity-60"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={onCancelAdding}
            className="rounded-2xl py-2.5 px-3 bg-paper border border-line text-mute font-bold text-sm"
          >
            Cancelar
          </button>
        </form>
      )}

      {error && (
        <div className="bg-chile/10 border border-chile/20 rounded-2xl p-3 text-sm text-chile">
          Error al cargar mesas: {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-mute">Cargando mesas...</div>
      ) : tables.length === 0 && !error ? (
        <div className="text-sm text-mute">No hay mesas. Agrega una.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpenTable(t)}
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
  );
}
