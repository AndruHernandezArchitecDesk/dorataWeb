# Dorata — Arquitectura técnica propuesta

Propuesta para soportar los tres frentes ya prototipados: **app cliente** (autogestión + mesa compartida), **app mesero** (tablet), **pantalla de cocina (KDS)**, más caja/pagos y panel administrativo.

---

## 1. Componentes del sistema

| Componente | Quién lo usa | Plataforma sugerida |
|---|---|---|
| App Cliente | Comensales, desde su celular (QR en la mesa) o para llevar | App móvil o **PWA** (evita fricción de instalar algo para escanear y pedir) |
| App Mesero | Meseros, en tablet | App móvil nativa/híbrida (necesita funcionar offline y con impresoras) |
| Kitchen Display System (KDS) | Cocina, en pantalla/tablet fija | Web app (Chrome kiosk) — se actualiza sin reinstalar nada |
| Panel Admin / Caja | Gerente y cajero | Web app (dashboard) |
| Backend / API | Todos los anteriores | Servicio central en la nube |
| Pasarela de pagos | Cliente y mesero al cobrar | Proveedor externo (Kushki, PlacetoPay, Stripe, según país) |
| Impresión de tickets | Cocina y caja | Impresoras térmicas ESC/POS en red o Bluetooth |

---

## 2. Por qué esta separación

El requisito central — **un pedido por mesa que varias personas y el mesero editan a la vez, y una cocina que ve todo unificado ordenado por pago** — es fundamentalmente un problema de **estado compartido en tiempo real**, no solo de tener varias apps. Por eso la pieza que más pesa en el diseño es la capa de sincronización, más que la tecnología de cada pantalla.

---

## 3. Stack recomendado

### Frontend
- **App Cliente y App Mesero:** React Native (con Expo) — un solo código base para iOS/Android, con vistas distintas según el rol. Alternativa: Flutter, si el equipo ya tiene esa experiencia. Para el cliente, evaluar además una **PWA en React** como puerta de entrada desde el QR (sin fricción de instalar), reservando la app nativa para clientes frecuentes/loyalty.
- **KDS y Panel Admin:** React + Vite (o Next.js si se necesita SSR/SEO en el panel).
- **UI compartida:** un paquete de componentes/tokens de diseño compartido (colores, tipografía Dorata, botones) entre las tres apps, para no reconstruir la marca tres veces.

### Backend
- **API:** Node.js con NestJS (estructura clara por módulos: pedidos, mesas, pagos, catálogo) exponiendo REST para operaciones normales.
- **Tiempo real:** WebSockets (Socket.IO o el soporte nativo de NestJS) para difundir cambios de un pedido a todos los dispositivos suscritos. Alternativa gestionada si se quiere reducir infraestructura propia: Supabase Realtime o Ably.
- **Base de datos:** PostgreSQL — relacional, con buen soporte transaccional (clave para la numeración de órdenes y los pagos). Prisma como ORM.
- **Cache / pub-sub interno:** Redis, útil tanto para sesiones cortas (token de mesa por QR) como para el canal de eventos si se escala a varias instancias del backend.

### Pagos
- Integración con un procesador con presencia local (p. ej. Kushki o PlacetoPay para Ecuador) vía su SDK, más soporte de datáfono/lector para el mesero si se cobra con tarjeta física en mesa.
- **Nunca se almacena el número de tarjeta**: se usa tokenización del proveedor (cumple PCI sin asumir ese alcance directamente).

### Impresión
- Microservicio o SDK ligero para impresoras térmicas ESC/POS (ticket de cocina y recibo de caja), conectado por red local o Bluetooth desde la tablet del mesero/caja.

### Infraestructura
- Contenedores (Docker) desplegados en un proveedor simple para este tamaño de operación (Render, Railway o Fly.io) y migrar a AWS/GCP si se crece a multi-sucursal.
- Un solo backend multi-tenant preparado desde el día uno con `branch_id` en cada tabla, aunque hoy sea una sola sucursal — evita una migración dolorosa si Dorata abre una segunda ubicación.
- Sentry para errores, y métricas básicas (tiempo de preparación, pedidos/hora) desde el mismo Postgres al inicio, sin herramienta de analítica separada todavía.

---

## 4. El corazón del sistema: el pedido como estado compartido

Cada **Pedido** (de mesa o para llevar) es una entidad con una lista de ítems, cada uno con quién lo agregó y su estado:

```
Pedido
 ├─ mesaId (o null si es para llevar)
 ├─ clienteInfo (nombre, si es para llevar)
 ├─ estado: abierto | comiendo | pagado_liberado
 ├─ numeroOrden: null hasta el momento del pago
 ├─ pagadoEn: timestamp, se asigna al cobrar
 └─ items: [
      { producto, cantidad, agregadoPor: cliente|mesero, enviadoACocina: bool }
    ]
```

**Flujo de sincronización:**
1. Cualquier dispositivo (celular de un comensal, tablet del mesero) hace una mutación (agregar ítem, quitar, enviar a cocina, cobrar) vía API.
2. El backend valida, escribe en Postgres, y publica un evento en el canal `pedido:{id}`.
3. Todos los clientes suscritos a ese canal (los celulares de la mesa, la tablet del mesero, el KDS) reciben la actualización y refrescan su vista — así el mesero ve al instante lo que un comensal agregó, y viceversa.
4. Se guarda un log de eventos por pedido (quién agregó/quitó qué y cuándo) — útil para resolver disputas de cuenta.

**Numeración al pagar:** el número de orden no es un campo que se llena al crear el pedido, sino que se genera dentro de la misma transacción de pago, usando una secuencia atómica por sucursal (`SELECT ... FOR UPDATE` o una secuencia de Postgres), evitando que dos cobros simultáneos choquen o salten números.

**Cola de cocina unificada:** el KDS no lee "pedidos", lee directamente los eventos de `pagadoEn` de mesas y de para-llevar, fusionados y ordenados por ese timestamp — es una vista, no una tabla nueva.

---

## 5. Consideraciones de confiabilidad

- **Offline en la tablet del mesero:** debe poder seguir tomando pedidos si el wifi del local falla un momento — se guardan las acciones en una cola local y se sincronizan al reconectar (patrón de sincronización optimista).
- **Idempotencia en el cobro:** si la tablet reintenta un cobro por un corte de red, el backend no debe cobrar ni numerar dos veces — se usa una clave de idempotencia por intento de pago.
- **Tokens de mesa por QR:** cada QR de mesa codifica un token de sesión de corta duración, no una URL fija reutilizable indefinidamente, para evitar que alguien fuera del restaurante añada ítems a una mesa.
- **Roles y permisos:** cliente solo puede tocar sus propios ítems; mesero y cocina se autentican con usuario/PIN de staff (RBAC simple: mesero, cocina, caja, admin).

---

## 6. Fases sugeridas de construcción

1. **MVP:** catálogo, pedido de mesa compartido, mesero, KDS unificado, cobro con numeración al pagar. Sin loyalty ni delivery externo.
2. **Fase 2:** panel admin con reportes de ventas, gestión de menú/inventario en tiempo real, impresión térmica.
3. **Fase 3:** cuentas de cliente y programa de lealtad, notificaciones push cuando el pedido para llevar está listo, soporte multi-sucursal completo.
4. **Fase 4:** integración con apps de delivery externas si Dorata decide ofrecer entrega a domicilio.

---

## Preguntas abiertas para afinar esto

- ¿Cuántas sucursales tiene o planea tener Dorata en el corto plazo? Cambia si vale la pena invertir en multi-tenant desde ya.
- ¿El cobro con tarjeta lo hace el mesero con un datáfono físico, o quieren que el pago se procese directamente dentro de la tablet/app?
- ¿Ya tienen impresoras térmicas u otro hardware de POS, o se elige desde cero?
