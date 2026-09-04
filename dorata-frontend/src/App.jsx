import { useEffect, useState } from "react";
import Header from "./components/Header";
import CategoryChips from "./components/CategoryChips";
import PublicidadCarousel from "./components/PublicidadCarousel";
import ProductGrid from "./components/ProductGrid";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import TrackingOverlay from "./components/TrackingOverlay";
import FloatingCartBar from "./components/FloatingCartBar";
import StaffLoginModal from "./components/StaffLoginModal";
import MeseroView from "./components/MeseroView";
import CocinaView from "./components/CocinaView";
import { useCart } from "./hooks/useCart";
import { setAuthToken, getMesaToken, setStaffToken, createOrder, getMenu } from "./lib/api";
import { CATEGORIES as FALLBACK_CATEGORIES, PRODUCTS as FALLBACK_PRODUCTS } from "./data/menu";

const BRANCH_ID = "branch-main";
const TABLE_ID = "table-1";

export default function App() {
  const [activeCategory, setActiveCategory] = useState(FALLBACK_CATEGORIES[0]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

  const [staff, setStaff] = useState(null);
  const [staffView, setStaffView] = useState(null); // "mesero" | "cocina"
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [remoteCategories, setRemoteCategories] = useState(null);
  const [remoteProducts, setRemoteProducts] = useState(null);

  const cart = useCart();

  const CATEGORIES = remoteCategories || FALLBACK_CATEGORIES;
  const PRODUCTS = remoteProducts || FALLBACK_PRODUCTS;

  useEffect(() => {
    getMesaToken(TABLE_ID, BRANCH_ID)
      .then((token) => {
        localStorage.setItem("dorata_table_token", token);
        setAuthToken(token);
      })
      .catch((err) => {
        const stored = localStorage.getItem("dorata_table_token");
        if (stored) {
          setAuthToken(stored);
        } else {
          setInitError(err.message);
        }
      })
      .finally(() => setInitializing(false));

    const storedStaff = localStorage.getItem("dorata_staff");
    if (storedStaff) {
      try {
        const s = JSON.parse(storedStaff);
        setStaffToken(s.token);
        setStaff(s);
      } catch {
        localStorage.removeItem("dorata_staff");
      }
    }
  }, []);

  // Cargar menú dinámico desde backend (productos y categorías creados por mesero)
  useEffect(() => {
    if (initializing) return;
    let interval;
    const loadMenu = () =>
      getMenu()
        .then((cats) => {
          if (!Array.isArray(cats) || cats.length === 0) return;
          const catNames = cats.map((c) => c.name);
          const prods = cats.flatMap((c) =>
            (c.products || []).map((p) => ({
              id: p.id,
              cat: c.name,
              name: p.name,
              price: Number(p.price),
              emoji: p.emoji || "🍽️",
              tag: p.tag || null,
              desc: p.description || "",
              hasExtras: !!p.hasExtras,
              hasSize: !!p.hasSize,
              image: p.image || null,
              active: p.active,
              categoryId: p.categoryId,
            }))
          );
          if (catNames.length) {
            setRemoteCategories(catNames);
            setActiveCategory((prev) => (catNames.includes(prev) ? prev : catNames[0]));
          }
          if (prods.length) setRemoteProducts(prods);
        })
        .catch(() => {
          // fallback a menú estático
        });
    loadMenu();
    interval = setInterval(loadMenu, 15000);
    const onFocus = () => loadMenu();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [initializing]);

  const filteredProducts = activeCategory
    ? PRODUCTS.filter((p) => p.cat === activeCategory)
    : PRODUCTS;

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleConfirmOrder = async (paymentMethod, customerName) => {
    const { orderId, orderNumber } = await createOrder({
      cart: cart.cart,
      orderType: cart.orderType,
      paymentMethod,
      customerName: customerName || undefined,
    });
    setOrderNumber(orderNumber);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);
    cart.clearCart();
  };

  const handleNewOrder = () => {
    setIsTrackingOpen(false);
    setOrderNumber(null);
  };

  const handleStaffLogin = (s) => {
    const token = localStorage.getItem("dorata_staff_token");
    localStorage.setItem("dorata_staff", JSON.stringify({ ...s, token }));
    setStaff(s);
    setIsLoginOpen(false);
    setStaffView(s.role === "COCINA" ? "cocina" : "mesero");
  };

  const handleLogout = () => {
    localStorage.removeItem("dorata_staff");
    localStorage.removeItem("dorata_staff_token");
    setStaffToken(null);
    setStaff(null);
    setStaffView(null);
  };

  const openStaffView = () => {
    setStaffView(staff.role === "COCINA" ? "cocina" : "mesero");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-sm text-mute">Conectando con la cocina...</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-5">
        <div className="bg-paper border border-line rounded-3xl p-5 max-w-sm w-full">
          <div className="text-lg font-display text-charcoal mb-2">Sin conexión</div>
          <div className="text-sm text-mute mb-4">{initError}</div>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl py-3 bg-flame text-cream font-extrabold text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (staffView === "cocina") {
    return <CocinaView onBack={() => setStaffView(null)} />;
  }

  if (staffView === "mesero") {
    return <MeseroView onBack={() => setStaffView(null)} />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header
        cartCount={cart.cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        staff={staff}
        onLoginClick={() => setIsLoginOpen(true)}
        onOpenStaffView={openStaffView}
        onLogout={handleLogout}
      />

      <PublicidadCarousel />

      <CategoryChips categories={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />

      <main className="max-w-6xl mx-auto px-5 py-4 pb-24">
        <ProductGrid products={filteredProducts} onSelect={setSelectedProduct} />
      </main>

      <FloatingCartBar
        count={cart.cartCount}
        total={cart.total}
        onClick={() => setIsCartOpen(true)}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(payload) => {
            cart.addToCart(payload);
            setSelectedProduct(null);
          }}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart.cart}
        updateQty={cart.updateQty}
        removeItem={cart.removeItem}
        orderType={cart.orderType}
        setOrderType={cart.setOrderType}
        subtotal={cart.subtotal}
        fee={cart.fee}
        total={cart.total}
        onCheckout={handleOpenCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={cart.total}
        orderType={cart.orderType}
        onConfirm={handleConfirmOrder}
      />

      <TrackingOverlay
        isOpen={isTrackingOpen}
        orderNumber={orderNumber}
        cart={cart.cart}
        onNewOrder={handleNewOrder}
      />

      <StaffLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleStaffLogin}
      />
    </div>
  );
}
