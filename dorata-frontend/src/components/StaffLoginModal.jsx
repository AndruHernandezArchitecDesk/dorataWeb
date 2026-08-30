import { useState } from "react";
import { X, Lock } from "lucide-react";
import { staffLogin } from "../lib/api";

export default function StaffLoginModal({ isOpen, onClose, onSuccess, onError }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const staff = await staffLogin(pin);
      setPin("");
      onSuccess(staff);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-paper rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-display text-charcoal">Acceso staff</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream flex items-center justify-center">
            <X size={16} className="text-charcoal" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-mute mb-4 text-sm">
          <Lock size={14} />
          <span>Ingresá tu PIN de staff</span>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="w-full rounded-2xl bg-cream border border-line px-4 py-3 text-center text-2xl font-display tracking-[0.5em] text-charcoal outline-none focus:border-flame"
          />
          {error && (
            <div className="text-center text-sm text-chile font-bold mt-3">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full mt-4 rounded-2xl py-4 bg-flame text-cream font-extrabold text-sm disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
