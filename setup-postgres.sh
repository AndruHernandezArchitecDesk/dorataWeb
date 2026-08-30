#!/bin/bash
# Script para configurar PostgreSQL para Dorata
# Ejecutar como: sudo bash setup-postgres.sh

set -e

echo "Creando usuario y base de datos para Dorata..."

sudo -u postgres psql <<'SQL'
CREATE USER dorata_user WITH PASSWORD 'dorata_pass';
CREATE DATABASE dorata OWNER dorata_user;
GRANT ALL PRIVILEGES ON DATABASE dorata TO dorata_user;
\c dorata
GRANT ALL ON SCHEMA public TO dorata_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dorata_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dorata_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dorata_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dorata_user;
SQL

echo "PostgreSQL configurado correctamente."
echo "Actualiza dorata-backend/.env con:"
echo "  DATABASE_URL=postgresql://dorata_user:dorata_pass@localhost:5432/dorata"
