# Dorata — Contexto del proyecto

Este documento es el punto de entrada para cualquier agente (Claude Code u otro)
que continúe este proyecto. Léelo primero, junto con `DESIGN_SYSTEM.md`,
`FRONTEND_HANDOFF.md` y `BACKEND_SPEC.md`.

## Qué es Dorata

Restaurante de hamburguesas. El proyecto cubre tres frentes de software:

1. **App/web cliente** — comensales piden desde su celular (QR en mesa) o para
   llevar. Varias personas pueden agregar ítems a la misma mesa en tiempo real.
2. **App mesero** (tablet) — mapa de mesas, toma pedidos, cobra, gestiona
   "para llevar".
3. **KDS / pantalla de cocina** — cola unificada de pedidos ya pagados,
   ordenada por momento de pago, sin importar si vienen de mesa o de para
   llevar.

Todo el detalle de negocio (flujo de pedido compartido, numeración de orden al
pagar, roles, etc.) está en `Dorata-Arquitectura-Tecnica.md` (documento
original, adjunto también en este contexto) — es la fuente de verdad del
dominio, no la reescribas, solo impleméntala.

## Decisiones ya tomadas

- **Frontend cliente:** React + Vite + Tailwind. Repo separado: `dorata-frontend`.
- **Frontend mesero/cocina:** hoy existe como prototipo estático (HTML/CSS/JS
  vanilla, un solo archivo) fiel al diseño. Migrarlo a React es un paso
  pendiente, mismo patrón que el frontend cliente.
- **Backend:** Node.js + PostgreSQL. Repo separado: `dorata-backend`.
  Ver `BACKEND_SPEC.md` para framework recomendado, schema y endpoints.
- **Hosting objetivo:** básico y barato (una sola sucursal). Frontends en
  Vercel/Netlify/Cloudflare Pages (estático). Backend en Railway o Render
  (soporta Node + WebSockets + Postgres administrado). Ver la sección
  "Hosting" más abajo para el detalle completo que ya se acordó.
- **Tiempo real:** WebSockets (Socket.IO o Supabase Realtime como alternativa
  gestionada) para sincronizar el pedido compartido entre celulares de la
  mesa, tablet del mesero y KDS.

## Estado actual (al momento de este handoff)

`dorata-frontend` tiene el scaffold de Vite + Tailwind ya creado y estos
componentes ya escritos:

- `src/data/menu.js` — catálogo (productos, extras, tamaños) como mock local.
- `src/lib/api.js` — capa de datos con **stubs** que ya tienen documentado
  exactamente qué llamada real (fetch/WebSocket) los debe reemplazar.
- `src/hooks/useCart.js` — estado del carrito (agregar, cantidad, quitar,
  totales).
- `src/components/Header.jsx`, `CategoryChips.jsx`, `ProductGrid.jsx`,
  `ProductModal.jsx` — completos.
- **Pendiente:** `CartDrawer.jsx`, `CheckoutModal.jsx`, `TrackingOverlay.jsx`,
  `FloatingCartBar.jsx`, y `App.jsx` que conecta todo. Hay una versión de
  referencia funcional (HTML/JS vanilla) de toda esta lógica en
  `reference/dorata-web.html` dentro de este mismo paquete — úsala como
  especificación de comportamiento al escribir los componentes que faltan,
  no la copies literal (está en vanilla JS, no en React).

Ver `FRONTEND_HANDOFF.md` para el detalle archivo por archivo y las
convenciones a seguir.

`dorata-backend` **no existe todavía** — es el siguiente paso grande.
`BACKEND_SPEC.md` tiene el plan concreto: framework, schema de Postgres
(borrador de Prisma), endpoints REST y eventos de WebSocket, y las fases de
construcción sugeridas.

También existe, como referencia visual/funcional (no como código a reutilizar
tal cual), un prototipo estático de mesero + cocina:
`reference/dorata-mesero-cocina.html`.

## Sistema de diseño

Todo el detalle de colores, tipografía y patrones de componente está en
`DESIGN_SYSTEM.md`. Resumen rápido: paleta charcoal/crema/naranja "flame",
tipografía Arial Black para títulos, tarjetas muy redondeadas (16–24px),
chips de categoría, y tres tipos de overlay (modal centrado, drawer lateral,
pantalla completa) según la importancia de la acción.

## Próximos pasos sugeridos (en orden)

1. Terminar los componentes que faltan en `dorata-frontend` (ver
   `FRONTEND_HANDOFF.md`).
2. Armar `dorata-backend`: schema Postgres + endpoints REST básicos (menú,
   crear pedido) — sin WebSockets todavía, para poder conectar el frontend
   cliente rápido.
3. Agregar WebSockets al backend y reemplazar los stubs de `api.js` en el
   frontend por las llamadas reales.
4. Migrar el prototipo de mesero/cocina a React, reusando el mismo patrón
   (`useCart`-style hooks, `api.js`-style stubs) para que se conecten al
   mismo backend.
5. Desplegar: frontends a Vercel/Netlify, backend a Railway/Render, Postgres
   administrado (mismo proveedor o Neon/Supabase).

## Hosting acordado (resumen)

| Componente | Dónde | Costo aprox. |
|---|---|---|
| Frontends (cliente, mesero, cocina) | Vercel / Netlify / Cloudflare Pages | $0 |
| Backend (API + WebSockets) | Railway o Render | $5–20/mes |
| Base de datos | Postgres administrado (Railway/Render/Neon) | $0–15/mes |
| Dominio + DNS | Cloudflare | ~$1/mes |

Impresoras térmicas y el KDS corren localmente en el restaurante (un
navegador en modo kiosko para el KDS; un pequeño agente en PC/Raspberry Pi
para las impresoras ESC/POS) — no se hostean en la nube.
