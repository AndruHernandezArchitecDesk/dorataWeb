import { useMemo, useState } from "react";
import { TAKEAWAY_FEE } from "../data/menu";

export function useCart() {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("COMER_AQUI");

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

  const { subtotal, fee, total, cartCount } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const fee = orderType === "PARA_LLEVAR" && cart.length > 0 ? TAKEAWAY_FEE : 0;
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    return { subtotal, tax: 0, fee, total: subtotal + fee, cartCount };
  }, [cart, orderType]);

  return {
    cart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    orderType,
    setOrderType,
    subtotal,
    tax: 0,
    fee,
    total,
    cartCount,
  };
}
