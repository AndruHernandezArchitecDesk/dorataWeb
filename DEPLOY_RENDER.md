# Deploy Gratis: Vercel (frontend) + Render (backend) + Neon (DB)

Este repo ya está preparado para Render Free (se duerme 15 min, muy limitado OK).

## 1. DB Gratis - Neon
1. Ve a https://neon.tech → Create Project → copia **Pooled connection string** `postgresql://...?sslmode=require`
2. Ej: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

## 2. Push a GitHub
```bash
git add .
git commit -m "chore: prepare deploy Render+Vercel"
git push origin main
```

## 3. Backend en Render (Free)
1. https://dashboard.render.com → New Web Service → conecta tu repo Dorata
2. **Root Directory:** `dorata-backend`
3. **Build Command:** `npm install && npx prisma generate && npm run build`
4. **Start Command:** `node dist/index.js`
5. **Env Vars:**
   - `DATABASE_URL` = tu Neon URL
   - `JWT_SECRET` = genera: `openssl rand -hex 32`
   - `CORS_ORIGIN` = deja `*` por ahora (luego pon tu URL Vercel)
   - `PORT` = `10000` (Render lo inyecta, pero el código usa `0.0.0.0:$PORT`)
6. Deploy → espera `Server running on port ...`
7. En **Shell** de Render ejecuta:
```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```
Verifica `GET https://TU-BACKEND.onrender.com/health` → `{"status":"ok"}`

## 4. Frontend en Vercel
1. https://vercel.com → Import Git Dorata → **Root Directory:** `dorata-frontend`
2. Framework: Vite, Build: `npm run build`, Output: `dist`
3. **Env Var:** `VITE_API_URL=https://TU-BACKEND.onrender.com` (sin `/api` al final, el código añade `/api/...`)
4. Deploy → obtienes `https://dorata-frontend-xxx.vercel.app`

## 5. Cerrar CORS
Vuelve a Render → Env `CORS_ORIGIN=https://dorata-frontend-xxx.vercel.app` → redeploy.

## Notas Free Tier
- Render Free duerme tras 15 min → primer request tarda 40s.
- Neon Free 0.5 GB, Vercel 100 GB/mes. Suficiente para Dorata (13 productos).
- Logs: Render Dashboard, Vercel Deployments.

## Alternativa todo-en-uno Railway
Si prefieres no separar, Railway.app despliega backend+DB con $5 free.

Archivo `render.yaml` ya incluido en raíz para deploy como Blueprint.
