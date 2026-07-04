# Pendientes bloqueados — requieren input de Emi

> Tareas que no se pueden ejecutar sin que Emi provea credenciales o decisiones.

---

## 1. Migrar SQLite → Postgres (Goal 3 / Task 51)

**Bloqueado por:** Emi necesita crear cuenta en Supabase o Neon y dar la connection string.

**Opciones:**
- **Supabase** (recomendado): https://supabase.com — free tier 500MB, Auth incluido
- **Neon**: https://neon.tech — free tier 3GB, solo Postgres

**Cuando Emi dé la URL:**
1. Cambiar `provider` de `"sqlite"` a `"postgresql"` en `prisma/schema.prisma:12`
2. Actualizar `DATABASE_URL` en `.env`
3. Correr `prisma migrate dev`
4. Verificar endpoints

**Task ID:** 51

---

## 2. Plan Club — aclarar moneda (USD vs ARS)

**Bloqueado por:** Emi necesita decidir si el plan Club es USD o ARS.

**Contexto:** `@/api/checkout/route.ts:33-38` — `amount: 19900, currency: 'usd'` = $199 USD. Landing dice `$199/año` sin aclarar moneda.

**Opciones:**
- Dejar en USD y aclarar en el landing
- Migrar a ARS con precio actualizado

**Task ID:** pendiente de asignar

---

## 3. Deploy a producción

**Bloqueado por:** Emi necesita decidir dónde hostear (Vercel, Netlify, etc.) y configurar variables de entorno.

**Task ID:** pendiente de asignar
