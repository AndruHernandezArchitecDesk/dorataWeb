# Dorata — Frontend cliente: estado y siguientes pasos

Repo: `dorata-frontend` (React + Vite + Tailwind).

## Cómo correrlo

```bash
npm install
cp .env.example .env   # ajustar VITE_API_URL / VITE_WS_URL cuando exista backend
npm run dev
```

## Estructura

```
dorata-frontend/
  index.html
  tailwind.config.js       # tokens de marca (ver DESIGN_SYSTEM.md)
  postcss.config.js
  vite.config.js
  .env.example
  src/
    main.jsx
    index.css
    App.jsx                 # ⚠️ PENDIENTE — ver abajo
    data/
      menu.js                # catálogo mock (productos, extras, tamaños)
    hooks/
      useCart.js              # ✅ listo
    lib/
      api.js                  # ✅ listo — stubs documentados, ver nota abajo
    components/
      Header.jsx               # ✅ listo
      CategoryChips.jsx         # ✅ listo
      ProductGrid.jsx            # ✅ listo
      ProductModal.jsx            # ✅ listo
      CartDrawer.jsx                # ⚠️ PENDIENTE
      CheckoutModal.jsx              # ⚠️ PENDIENTE
      TrackingOverlay.jsx             # ⚠️ PENDIENTE
      FloatingCartBar.jsx              # ⚠️ PENDIENTE
```

## Componentes ya construidos — convenciones a mantener

- **Props explícitas, sin Context.** El árbol es poco profundo, así que
  `App.jsx` llama a `useCart()` una sola vez y pasa lo necesario como props a
  cada componente. No introducir `CartContext` u otro Context a menos que el
  árbol crezca mucho — mantener la simplicidad actual.
- **Un componente = un archivo**, nombre en PascalCase igual al archivo.
- **Tailwind puro**, sin CSS-in-JS ni módulos `.module.css`. Clases
  utilitarias directo en el JSX, usando los tokens del `tailwind.config.js`
  (`bg-flame`, `text-charcoal`, etc.), nunca hex hardcodeado.
- **Iconos:** `lucide-react`, ya importado donde se usa (ver `Header.jsx` o
  `ProductModal.jsx` como ejemplo de import/uso).
- **Dinero:** siempre formatear con `money()` de `src/data/menu.js`, no
  hacer `.toFixed(2)` suelto en los componentes.

## Componentes pendientes — especificación de comportamiento

Toda esta lógica ya existe probada en `reference/dorata-web.html` (vanilla
JS) dentro de este mismo paquete de handoff — es la referencia de
comportamiento exacto. Portarla a React con los patrones de arriba, no
copiarla literal.

### `CartDrawer.jsx`
Props sugeridas: `{ isOpen, onClose, cart, updateQty, removeItem, orderType, setOrderType, subtotal, tax, total, onCheckout }`.
- Drawer deslizante desde la derecha (ver sección "Overlays" en
  `DESIGN_SYSTEM.md`).
- Selector de tipo de pedido: chips "Recoger" / "Domicilio" / "Comer aquí".
- Lista de ítems con stepper de cantidad y botón de quitar.
- Estado vacío con icono + texto cuando `cart.length === 0`.
- Resumen (subtotal/impuestos/total) y botón "Continuar" → llama `onCheckout`.

### `CheckoutModal.jsx`
Props sugeridas: `{ isOpen, onClose, total, onConfirm }` donde `onConfirm(paymentMethod)`.
- Modal centrado con 3 métodos de pago (tarjeta / efectivo / billetera
  digital) como opciones tipo radio.
- Botón "Confirmar pedido" que llama `createOrder()` de `lib/api.js` — es
  aquí donde se conecta al backend cuando exista.

### `TrackingOverlay.jsx`
Props sugeridas: `{ isOpen, orderNumber, cart, onNewOrder }`.
- Pantalla completa (no modal) — ver sección "Overlays" en
  `DESIGN_SYSTEM.md`.
- Al montarse (`useEffect`), llama `subscribeToOrderStatus(orderNumber, setStage)`
  de `lib/api.js` y limpia la suscripción al desmontar.
- 3 etapas visuales: Recibido → Preparando → Listo para recoger, con línea de
  progreso entre íconos.
- Resumen del pedido debajo.
- Botón "Hacer otro pedido" → `onNewOrder` (limpia carrito y cierra overlay).

### `FloatingCartBar.jsx`
Props sugeridas: `{ count, total, onClick }`.
- Barra flotante inferior, **solo visible en mobile** (`md:hidden` en
  Tailwind), oculta cuando `count === 0`.
- En desktop/tablet el botón de carrito del `Header` ya es suficiente.

### `App.jsx` — arma todo
Estado local a manejar (además de `useCart()`):
- `activeCategory` (default: primera de `CATEGORIES`)
- `selectedProduct` (para abrir `ProductModal`, `null` = cerrado)
- `isCartOpen`, `isCheckoutOpen`, `isTrackingOpen`
- `orderNumber` (seteado al confirmar pago, se lo pasa a `TrackingOverlay`)

Flujo: click producto → `ProductModal` → `addToCart` (del hook) → cierra
modal. Header/FloatingCartBar → abre `CartDrawer` → "Continuar" → abre
`CheckoutModal` → "Confirmar" → `createOrder()` → guarda `orderNumber`,
cierra checkout, abre `TrackingOverlay`.

## Nota sobre `lib/api.js`

Ya tiene los dos stubs (`createOrder`, `subscribeToOrderStatus`) con la firma
final y, comentada arriba de cada uno, la implementación real que hay que
descomentar/adaptar cuando `dorata-backend` exista (ver `BACKEND_SPEC.md`
para los endpoints exactos). No hay que tocar la firma de estas funciones al
integrarlas en los componentes — así el swap a backend real no obliga a
tocar la UI.
