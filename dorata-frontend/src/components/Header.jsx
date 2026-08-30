import { MapPin, Search, ShoppingBag, LogIn, ChefHat } from "lucide-react";

export default function Header({ cartCount, onOpenCart, staff, onLoginClick, onOpenStaffView, onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-cream border-b border-line">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-mute">
            <MapPin size={12} />
            <span className="text-[11px] font-bold">Recoger en · Sucursal Centro</span>
          </div>
          <div className="text-2xl font-display text-charcoal leading-none mt-0.5">DORATA</div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            aria-label="Buscar"
            className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center flex-shrink-0"
          >
            <Search size={16} className="text-cream" />
          </button>

          {staff ? (
            <>
              <button
                onClick={onOpenStaffView}
                className="flex items-center gap-1.5 bg-green text-cream rounded-full pl-3 pr-3.5 py-2.5 font-bold text-sm"
              >
                <ChefHat size={16} />
                <span>{staff.role === "COCINA" ? "Cocina" : staff.role === "ADMIN" ? "Admin" : "Mesero"}</span>
              </button>
              <button
                onClick={onLogout}
                className="text-xs font-bold text-mute underline"
              >
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 bg-charcoal text-cream rounded-full pl-3 pr-3.5 py-2.5 font-bold text-sm"
            >
              <LogIn size={16} />
              <span>Staff</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-charcoal text-cream rounded-full pl-3.5 pr-4 py-2.5 font-bold text-sm relative"
          >
            <ShoppingBag size={16} />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-flame text-cream text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
