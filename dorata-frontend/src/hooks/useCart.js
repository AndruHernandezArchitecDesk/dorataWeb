import { useMemo, useState } from "react";

const TAX_RATE = 0.08;

export function useCart() {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Recoger");

  const addToCart = ({ product, qty, size, extras, unitPrice }) => {
    setCart((prev) => [
      ...prev,
      {
        cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product,
        qty,
        size,
        extras,
        unitPrice,
        lineTotal: unitPrice * qty,
      },
    ]);
  };

  const updateQty = (cartId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const qty = Math.max(1, item.qty + delta);
        return { ...item, qty, lineTotal: item.unitPrice * qty };
      })
    );
  };

  const removeItem = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const { subtotal, tax, total, cartCount } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = subtotal * TAX_RATE;
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    return { subtotal, tax, total: subtotal + tax, cartCount };
  }, [cart]);

  return {
    cart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    orderType,
    setOrderType,
    subtotal,
    tax,
    total,
    cartCount,
  };
}
