import { useState } from "react";
import { Banknote, Landmark, X, Copy, Check } from "lucide-react";
import { money, BANK_INFO } from "../data/menu";

const PAYMENT_OPTIONS = [
  { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { id: "TRANSFERENCIA", label: "Transferencia", icon: Landmark },
];

function QRPlaceholder({ value }) {
  // QR de ejemplo sin librería externa: usa API visual simple con div + banco info
  // Para QR real se puede instalar qrcode.react, pero placeholder evita dependencia
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    value + "|EJEMPLO"
  )}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={qrUrl}
        alt="QR Transferencia Pichincha - ejemplo"
        width={160}
        height={160}
        className="rounded-xl border border-line bg-white p-2"
        loading="lazy"
      />
      <span className="text-[10px] text-mute text-center max-w-[180px]">
        QR de ejemplo – muestra este código en caja. No transaccional hasta confirmar datos reales.
      </span>
    </div>
  );
}

export default function CheckoutModal({ isOpen, onClose, total, orderType, onConfirm }) {
  const [method, setMethod] = useState("EFECTIVO");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  if (!isOpen) return null;

  const isParaLlevar = orderType === "PARA_LLEVAR";
  const nameError = isParaLlevar && !name.trim() ? "Ingresa tu nombre para Para llevar" : null;
  const canConfirm = !loading && (!isParaLlevar || name.trim().length >= 2);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onConfirm(method, name);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper rounded-3xl p-5 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
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
          {isParaLlevar && (
            <div className="text-[11px] text-mute">Incluye $0.25 cargo Para llevar</div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs label-font text-charcoal">
            NOMBRE DEL CLIENTE {isParaLlevar ? <span className="text-flame">* obligatorio</span> : <span className="text-mute font-normal">(opcional para Comer aquí)</span>}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isParaLlevar ? "Ej: Juan Pérez (requerido)" : "Ej: Juan Pérez"}
            required={isParaLlevar}
            aria-invalid={!!nameError}
            className={`rounded-2xl bg-cream border px-4 py-3 text-sm text-charcoal outline-none focus:border-flame ${
              nameError ? "border-red-400" : "border-line"
            }`}
          />
          {nameError && <span className="text-xs text-red-500">{nameError}</span>}
          {isParaLlevar && !nameError && <span className="text-[11px] text-mute">Usaremos tu nombre para llamarte cuando esté listo para llevar.</span>}
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

        {method === "TRANSFERENCIA" && (
          <div className="bg-cream border border-line rounded-2xl p-4 flex flex-col gap-4">
            <div className="text-xs label-font text-charcoal">DATOS TRANSFERENCIA – BANCO DEL PICHINCHA (EJEMPLO)</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { k: "banco", label: "Banco", value: BANK_INFO.banco },
                { k: "titular", label: "Titular", value: BANK_INFO.titular },
                { k: "cuenta", label: `${BANK_INFO.tipoCuenta}`, value: BANK_INFO.numeroCuenta },
                { k: "ruc", label: "RUC", value: BANK_INFO.ruc },
                { k: "email", label: "Email", value: BANK_INFO.email },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between gap-3 bg-paper rounded-xl px-3 py-2 border border-line">
                  <div className="flex flex-col">
                    <span className="text-[10px] label-font text-mute">{row.label.toUpperCase()}</span>
                    <span className="text-sm font-bold text-charcoal">{row.value}</span>
                  </div>
                  <button
                    onClick={() => copy(row.value, row.k)}
                    className="w-8 h-8 rounded-full bg-cream border border-line flex items-center justify-center"
                    aria-label={`Copiar ${row.label}`}
                  >
                    {copied === row.k ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-mute" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-line">
              <QRPlaceholder value={`${BANK_INFO.qrPayload}|${total.toFixed(2)}`} />
              <div className="text-[11px] text-mute text-center">
                Total a transferir: <span className="font-bold text-charcoal">{money(total)}</span> – indica tu nombre en el comprobante.
              </div>
              <div className="text-[11px] text-mute text-center max-w-[280px]">
                Datos de ejemplo – reemplazar por datos reales del Banco del Pichincha en producción.
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full rounded-2xl py-4 bg-flame text-cream font-extrabold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Procesando..." : "Confirmar pedido"}
        </button>
        {!canConfirm && isParaLlevar && (
          <span className="text-xs text-center text-mute -mt-3">Completa tu nombre para continuar (Para llevar)</span>
        )}
      </div>
    </div>
  );
}
