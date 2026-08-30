# Dorata - Setup

## Requisitos

- Node.js 18+
- PostgreSQL corriendo localmente
- Base de datos `dorata` creada

## Configuración rápida

1. **Configurar PostgreSQL**:
   ```bash
   # En PostgreSQL, crear un usuario y base de datos
   sudo -u postgres psql
   CREATE USER dorata_user WITH PASSWORD 'dorata_pass';
   CREATE DATABASE dorata OWNER dorata_user;
   \q
   ```

2. **Configurar variables de entorno**:
   ```bash
   cd dorata-backend
   cp .env.example .env
   # Editar .env con:
   # DATABASE_URL=postgresql://dorata_user:dorata_pass@localhost:5432/dorata
   # JWT_SECRET=un-secreto-largo-y-aleatorio
   ```

3. **Levantar todo**:
   ```bash
   cd dorata-backend
   npm install
   npx prisma migrate dev --name init
   npm run seed
   npm run dev
   ```

4. **En otra terminal, levantar el frontend**:
   ```bash
   cd dorata-frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

O usar el script unificado:
```bash
bash start.sh
```

## Credenciales de prueba

- Staff PIN: `1234`
- Mesa 1: tableId `table-1`

## Troubleshooting

Si `npx prisma migrate dev` falla con "database does not exist":
```bash
sudo -u postgres psql -c "CREATE DATABASE dorata OWNER dorata_user;"
```

Si falla con "role does not exist":
```bash
sudo -u postgres psql -c "CREATE USER dorata_user WITH PASSWORD 'dorata_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dorata TO dorata_user;"
```
