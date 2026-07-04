# Deploy en Railway

## Pasos para deployar

1. **Crear proyecto en Railway:** https://railway.app
2. **Conectar el repo de GitHub:** `Memu007/fulbitoynera`
3. **Variables de entorno necesarias en Railway:**
   - `DATABASE_URL` — URL de SQLite o Postgres (si usás SQLite, usá `file:./custom.db`)
   - `NEXTAUTH_SECRET` — string largo aleatorio
   - `NEXTAUTH_URL` — URL de Railway (ej: `https://tuprojecto.up.railway.app`)
   - `STRIPE_SECRET_KEY` — clave de Stripe (usá `demo` para modo demo)
   - `STRIPE_WEBHOOK_SECRET` — secret del webhook de Stripe
   - `NEXT_PUBLIC_APP_URL` — misma URL que `NEXTAUTH_URL`
4. **Configurar Prisma:** Railway va a correr `npm run build` que incluye `prisma generate`. Si usás SQLite, asegurate de que el archivo esté en `/app/custom.db` y la DB se cree.
5. **Deployar:** Railway detecta `railway.json` y `Procfile` automáticamente.

## Notas importantes

- Modo demo: con `STRIPE_SECRET_KEY=demo` no se cobra real.
- Para cobros reales, configurá Stripe y el webhook.
- El proyecto usa Next.js 16 standalone. Railway va a correr `npm run start`.
- Si usás Postgres, cambiá el provider en `prisma/schema.prisma` y la `DATABASE_URL`.

## URLs útiles

- Panel de Railway: https://railway.app/dashboard
- Repo: https://github.com/Memu007/fulbitoynera
