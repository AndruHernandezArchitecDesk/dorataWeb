# Dorata Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL + Socket.IO.

## Requisitos

- Node.js 18+
- PostgreSQL corriendo localmente
- Base de datos `dorata` creada

## Setup

```bash
npm install
cp .env.example .env   # ajustar DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npx prisma migrate dev --name init
npm run seed
npm run dev
```

## Configuración de PostgreSQL

Si no tenés PostgreSQL configurado, ejecutá:

```bash
# Crear usuario y base de datos
sudo -u postgres psql -c "CREATE USER dorata_user WITH PASSWORD 'dorata_pass';"
sudo -u postgres psql -c "CREATE DATABASE dorata OWNER dorata_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dorata TO dorata_user;"
```

Luego actualizá `dorata-backend/.env`:
```
DATABASE_URL=postgresql://dorata_user:dorata_pass@localhost:5432/dorata
JWT_SECRET=super-secret-dev-key-change-in-production
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

## Endpoints principales

- `POST /api/staff/login` - login con PIN (mesero/cocina/caja/admin)
- `POST /api/mesa/token` - obtener token de mesa (para clientes)
- `GET /api/menu?branchId=...` - catálogo
- `GET /api/tables?branchId=...` - mapa de mesas
- `POST /api/orders` - crear pedido (clientes y staff)
- `GET /api/orders/:id` - detalle de pedido
- `PATCH /api/orders/:id/items` - modificar ítems
- `POST /api/orders/:id/send-kitchen` - enviar a cocina
- `POST /api/orders/:id/pay` - cobrar y asignar número
- `POST /api/orders/:id/ready` - marcar listo
- `POST /api/orders/:id/release` - liberar mesa/cerrar para llevar
- `GET /api/kitchen/queue?branchId=...` - cola unificada de cocina

## WebSockets

- `socket.io` en el mismo puerto
- `subscribe:order` / `unsubscribe:order`
- `subscribe:kitchen`
- Eventos emitidos: `order:updated`, `order:paid`, `order:ready`

## Seed

Crea sucursal, categorías, productos, extras, Mesa 1, staff (PIN: `1234`) y secuencia de numeración.

```bash
npm run seed
```

Staff de prueba: `1234`

## Notas

- El frontend cliente usa token de mesa obtenido via `POST /api/mesa/token`
- Los endpoints de staff requieren JWT con rol válido
- Socket.IO requiere JWT en `auth.token` o header `Authorization`
