# Dorata — Backend spec (Node.js + PostgreSQL)

Este documento traduce `Dorata-Arquitectura-Tecnica.md` (el doc de
arquitectura original, más completo en el "por qué") a algo directamente
construible. Si hay conflicto entre ambos, ese doc manda en decisiones de
producto/negocio; este manda en decisiones de implementación concretas.

Repo: `dorata-backend` (no existe todavía — crear desde cero).

## Stack recomendado

- **Framework:** Express + TypeScript. El doc original sugiere NestJS por
  estructura; para "hosting básico" y una sola sucursal, Express es más
  simple de que un agente lo arme y de mantener, con una carpeta por módulo
  para no perder orden (`orders/`, `tables/`, `menu/`, `payments/`). Si el
  proyecto crece mucho, migrar a NestJS es sencillo porque Express con
  módulos separados ya sigue una forma parecida.
- **ORM:** Prisma (con PostgreSQL).
- **Tiempo real:** Socket.IO.
- **Validación:** Zod en los request bodies.
- **Auth simple (mesero/cocina/caja/admin):** JWT + PIN de staff, sin OAuth
  externo por ahora (es uso interno).

## Variables de entorno

```
DATABASE_URL=postgresql://user:pass@host:5432/dorata
JWT_SECRET=...
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

## Modelo de datos (borrador de schema Prisma)

Refleja el modelo de "Pedido" descrito en `Dorata-Arquitectura-Tecnica.md`
(sección 4), unificando mesa y para-llevar en una sola entidad `Order` con
`tableId` nulo para para-llevar — así el KDS puede leer una sola tabla.

```prisma
model Branch {
  id        String   @id @default(cuid())
  name      String
  tables    Table[]
  orders    Order[]
  products  Product[]
  staff     Staff[]
}

model Table {
  id        String   @id @default(cuid())
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id])
  label     String   // "Mesa 3"
  seats     Int
  status    TableStatus @default(LIBRE)
  orders    Order[]
}

enum TableStatus {
  LIBRE
  PIDIENDO
  COCINA
  COMIENDO
}

model Category {
  id        String   @id @default(cuid())
  name      String
  products  Product[]
}

model Product {
  id          String   @id @default(cuid())
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  emoji       String?
  hasExtras   Boolean  @default(false)
  hasSize     Boolean  @default(false)
  active      Boolean  @default(true)
}

model Extra {
  id    String  @id @default(cuid())
  name  String
  price Decimal @db.Decimal(10, 2)
}

model Order {
  id           String      @id @default(cuid())
  branchId     String
  branch       Branch      @relation(fields: [branchId], references: [id])
  tableId      String?     // null = para llevar
  table        Table?      @relation(fields: [tableId], references: [id])
  customerName String?     // solo para llevar
  orderType    OrderType   @default(RECOGER)
  status       OrderStatus @default(ABIERTO)
  orderNumber  Int?        // se asigna SOLO al pagar (secuencia atómica por sucursal)
  items        OrderItem[]
  subtotal     Decimal     @db.Decimal(10, 2) @default(0)
  tax          Decimal     @db.Decimal(10, 2) @default(0)
  tip          Decimal     @db.Decimal(10, 2) @default(0)
  total        Decimal     @db.Decimal(10, 2) @default(0)
  paymentMethod PaymentMethod?
  idempotencyKey String?   @unique // evita cobros/numeración duplicados
  createdAt    DateTime    @default(now())
  paidAt       DateTime?
  readyAt      DateTime?
  releasedAt   DateTime?
}

enum OrderType {
  RECOGER
  DOMICILIO
  COMER_AQUI
}

enum OrderStatus {
  ABIERTO         // se están agregando ítems, sin pagar
  ENVIADO_COCINA
  PAGADO          // dispara numeración; visible en KDS
  LISTO
  ENTREGADO       // mesa liberada / para-llevar retirado
}

enum PaymentMethod {
  TARJETA
  EFECTIVO
  BILLETERA_DIGITAL
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  productId   String
  productName String   // snapshot, por si el producto cambia de nombre luego
  unitPrice   Decimal  @db.Decimal(10, 2)
  qty         Int
  size        String?
  extras      Json?    // [{id, name, price}]
  addedBy     String   // "mesero" | id de comensal en mesa compartida
  sentToKitchen Boolean @default(false)
  createdAt   DateTime @default(now())
}

model Staff {
  id       String   @id @default(cuid())
  branchId String
  branch   Branch   @relation(fields: [branchId], references: [id])
  name     String
  pin      String   // hasheado
  role     StaffRole
}

enum StaffRole {
  MESERO
  COCINA
  CAJA
  ADMIN
}

model OrderNumberSequence {
  branchId String @id
  current  Int    @default(0)
}
```

Nota sobre la numeración al pagar (crítico, ver sección 4 del doc original):
usar una transacción que haga `UPDATE OrderNumberSequence SET current = current + 1 WHERE branchId = ? RETURNING current` dentro de la misma transacción que marca la orden como `PAGADO`, para que dos cobros simultáneos nunca choquen ni salten número.

## Endpoints REST (MVP)

```
GET    /api/menu                      → categorías + productos + extras + tamaños
POST   /api/orders                    → crea un pedido (mesa o para llevar)
GET    /api/orders/:id                → detalle de un pedido
PATCH  /api/orders/:id/items          → agregar/quitar/cambiar cantidad de ítems
POST   /api/orders/:id/send-kitchen   → marca ítems como enviados a cocina
POST   /api/orders/:id/pay            → cobra, asigna orderNumber (idempotente vía header Idempotency-Key)
POST   /api/orders/:id/ready          → cocina marca listo
POST   /api/orders/:id/release        → libera mesa / cierra para-llevar
GET    /api/tables                    → mapa de mesas con su orden activa (si existe)
GET    /api/kitchen/queue             → cola unificada, ordenada por paidAt
POST   /api/staff/login               → PIN → JWT
```

Todas las rutas de staff (mesero/cocina/caja/admin) van protegidas con el JWT
de `POST /api/staff/login` y chequeo de `role` según la acción — el cliente
final (celular en la mesa) solo pega a `GET /api/menu`, `POST /api/orders` y
`PATCH /api/orders/:id/items`, autenticado con el token de mesa por QR (de
corta duración, no una URL fija — ver sección 5 del doc original).

## Eventos de WebSocket (Socket.IO)

Canal por pedido: `pedido:{orderId}`. Todo dispositivo suscrito a ese canal
(celulares de la mesa, tablet del mesero, KDS si aplica) recibe:

```
order:updated       { order }        // cualquier cambio de ítems/estado
order:paid          { order }        // dispara aparición en el KDS
order:ready          { order }
```

Canal de cocina, para no tener que suscribirse a N canales de pedido:
`kitchen:{branchId}` — recibe `order:paid` y `order:ready` de todos los
pedidos de esa sucursal.

## Fases de construcción (igual que el doc original, sección 6)

1. **MVP:** schema completo, endpoints REST de arriba (sin WebSockets
   todavía — el frontend puede hacer polling simple al inicio), catálogo,
   pedido de mesa compartido, cobro con numeración atómica.
2. **Fase 2:** agregar Socket.IO y reemplazar el polling del frontend por
   los eventos de arriba (ver `lib/api.js` en `dorata-frontend`, ya tiene el
   punto de integración marcado). Impresión térmica.
3. **Fase 3:** cuentas de cliente / loyalty, push notifications,
   multi-sucursal completo (el schema ya tiene `branchId` en todo desde el
   día uno, así que esto es principalmente lógica, no migración de datos).
4. **Fase 4:** integraciones de delivery externo.

## Qué NO construir todavía

- No implementar pasarela de pago real en el MVP — dejar `paymentMethod`
  como un enum informativo y simular el cobro (como ya hace el frontend). La
  integración con Kushki/PlacetoPay es un paso posterior y depende de
  decisiones legales/comerciales que no están cerradas.
- No construir el microservicio de impresión térmica todavía — es un agente
  separado que corre en la red local del restaurante, no en el hosting.
