import { ShoppingBag } from "lucide-react";
import { money } from "../data/menu";

export default function FloatingCartBar({ count, total, onClick }) {
  if (count === 0) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-charcoal text-cream border-t border-line">
      <div className="px-5 py-3 flex items-center justify-between">
        <button onClick={onClick} className="flex items-center gap-3">
          <span className="relative w-10 h-10 rounded-full bg-flame flex items-center justify-center">
            <ShoppingBag size={18} className="text-cream" />
            <span className="absolute -top-1 -right-1 bg-chile text-cream text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {count}
            </span>
          </span>
          <div className="text-left">
            <div className="text-xs font-bold text-cream">Ver carrito</div>
            <div className="text-[11px] text-mute">{money(total)}</div>
          </div>
        </button>

        <button onClick={onClick} className="rounded-full px-5 py-3 bg-flame text-cream font-extrabold text-sm">
          Ver
        </button>
      </div>
    </div>
  );
}
