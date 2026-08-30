#!/bin/bash
set -e

BACKEND_DIR="$(cd "$(dirname "$0")/dorata-backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/dorata-frontend" && pwd)"

echo "=== Dorata ==="
echo "Backend: $BACKEND_DIR"
echo "Frontend: $FRONTEND_DIR"
echo ""

# Verificar que PostgreSQL esté corriendo
if ! pg_isready -h localhost >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL no está corriendo en localhost:5432"
  echo "Inicia PostgreSQL con: sudo service postgresql start"
  exit 1
fi

echo "✓ PostgreSQL corriendo"

# Verificar que exista .env en backend
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "ERROR: Falta $BACKEND_DIR/.env"
  echo "Crea el archivo con DATABASE_URL, JWT_SECRET, PORT y CORS_ORIGIN"
  echo "Ejemplo:"
  echo "  DATABASE_URL=postgresql://dorata_user:dorata_pass@localhost:5432/dorata"
  echo "  JWT_SECRET=super-secret-dev-key-change-in-production"
  echo "  PORT=4000"
  echo "  CORS_ORIGIN=http://localhost:5173"
  exit 1
fi

echo "✓ Variables de entorno del backend configuradas"

cd "$BACKEND_DIR"

# Verificar que node_modules exista
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias del backend..."
  npm install
fi

# Verificar conexión a base de datos
echo "Verificando conexión a base de datos..."
if ! npx prisma migrate status >/dev/null 2>&1; then
  echo "Aplicando migraciones..."
  npx prisma migrate dev --name init
else
  echo "✓ Migraciones aplicadas"
fi

# Ejecutar seed
echo "Ejecutando seed..."
npm run seed 2>/dev/null || echo "⚠ Seed ya ejecutado o con error (continuar de todas formas)"

echo "Levantando backend..."
npm run dev &
BACKEND_PID=$!

echo "✓ Backend corriendo (PID: $BACKEND_PID)"

# Esperar a que el backend esté listo
sleep 4

cd "$FRONTEND_DIR"

# Verificar que node_modules exista
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias del frontend..."
  npm install
fi

echo "Levantando frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✓ Frontend corriendo (PID: $FRONTEND_PID)"

echo ""
echo "=== Dorata corriendo ==="
echo "  Frontend (clientes):  http://localhost:5173"
echo "  Backend (API):        http://localhost:4000"
echo ""
echo "Presiona Ctrl+C para detener ambos"

# Manejar Ctrl+C
trap "echo ''; echo 'Deteniendo servicios...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait

