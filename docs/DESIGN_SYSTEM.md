# Dorata — Sistema de diseño

Extraído de los mockups originales (`DorataApp.jsx`,
`DorataMeseroCocinaYMesa.jsx`) y ya aplicado en `dorata-frontend` vía
`tailwind.config.js`. Cualquier pantalla o componente nuevo debe seguir esto,
no improvisar colores o tipografías nuevas.

## Paleta de colores

| Token Tailwind | Hex | Uso |
|---|---|---|
| `charcoal` | `#1C1B1A` | Texto de títulos, fondos oscuros (botones primarios oscuros, KDS) |
| `cream` | `#FFF8ED` | Fondo general de la app |
| `paper` | `#FFFDF8` | Fondo de tarjetas, modales, drawers |
| `flame` | `#FF5A1F` | Color de marca / acción principal (CTA, precios, badges de "en cocina") |
| `yolk` | `#FFC93C` | Estados de espera ("Pidiendo", "Sin pagar") |
| `chile` | `#D62828` | Acentos picantes, alertas |
| `ink` | `#2A2622` | Texto de cuerpo |
| `mute` | `#9A9187` | Texto secundario, iconos inactivos |
| `line` | `#EDE4D3` | Bordes |
| `green` | `#3F7D4E` | Estados "listo" / "comiendo" / confirmaciones |

## Tipografía

- **Títulos y labels de marca:** `font-display` → `'Arial Black', Arial, sans-serif`,
  con `letter-spacing` negativo en títulos grandes (`tracking-tight` aprox) y
  positivo/expandido en labels pequeños (clase utilitaria `.label-font` en
  `index.css`, usa `letter-spacing: 0.08em` + mayúsculas).
- **Cuerpo:** `font-body` → Inter / system-ui.

## Radios y espaciado

- Tarjetas de producto/mesa: `rounded-2xl` (16px).
- Modales, drawers, tarjetas grandes: `rounded-3xl` (24px), o `rounded-t-3xl`
  cuando el modal nace desde abajo en mobile.
- Chips y botones pill: `rounded-full`.
- Bordes: `1px` o `1.5px` sólido con color `line`, salvo estados activos que
  usan el color semántico (`flame`, `yolk`, `green`).

## Patrones de componente

- **Chip de categoría/filtro:** fondo `paper` + borde `line` en reposo; fondo
  `charcoal` + texto `cream` cuando está activo. Nunca usar `flame` como
  fondo de chip activo (ese color se reserva para CTAs y precios).
- **Tarjeta de producto:** imagen/emoji en contenedor cuadrado `bg-cream`
  redondeado, nombre en negrita, precio en `flame`. Badge opcional arriba a
  la izquierda (`yolk` para "Popular/Nuevo", `chile` para "Picante").
- **Botón primario (CTA):** fondo `flame`, texto `cream`, `font-extrabold`,
  full-width, `rounded-2xl`, padding generoso (`py-4`).
- **Botón secundario/oscuro:** fondo `charcoal`, texto `cream`. Se usa para
  acciones de navegación o confirmaciones que no son la conversión principal
  (ej. "Enviar a cocina" vs. "Cobrar en caja").
- **Overlays**, según qué tan disruptiva es la acción:
  - **Modal centrado** (`ProductModal`, checkout): para decisiones puntuales
    dentro de un flujo, no pierde el contexto de fondo.
  - **Drawer lateral** (carrito): para algo que se consulta/edita
    frecuentemente sin abandonar la pantalla principal.
  - **Pantalla completa** (seguimiento de pedido, confirmación de pago): para
    el desenlace de un flujo, donde no queremos que compita con nada más.
- **Estados con color semántico** (mapa de mesas, KDS): cada estado tiene un
  par fondo/texto fijo — no reinventar combinaciones:
  - Libre → `paper` / `mute`
  - Pidiendo / Sin pagar → `yolk` / `charcoal`
  - En cocina → `flame` / `cream`
  - Comiendo / Listo → `green` / `cream`

## Iconografía

`lucide-react` en el frontend cliente (ya instalado en `package.json`).
Trazo (`strokeWidth`) por defecto de la librería, tamaños típicos 12–20px
según contexto (chip pequeño vs. botón de acción). No usar iconos rellenos
(filled) ni de otra librería — rompe la consistencia visual con los mockups
originales.

## Responsive

- Mobile-first. Grids de producto: 2 columnas en mobile → 3 (sm) → 4 (md) →
  5 (xl).
- El carrito es un drawer en todas las resoluciones (no se vuelve sidebar
  fijo en desktop) — así se mantiene 1:1 con el comportamiento ya validado en
  el prototipo.
- La vista mesero/cocina es tablet-first (uso real en el local), pero debe
  degradarse con gracia a mobile y desktop para poder probarla/demostrarla
  desde cualquier dispositivo.
