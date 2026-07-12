# HANDOFF — Pizarra Pro

App Next.js 16 standalone. El cliente canvas modular vive en `public/`; APIs, auth, Prisma y pagos en `src/app/api`.

## Verificado

- Auth Credentials, reset con token hasheado, límites Free y planes canónicos.
- Jugadas cloud con validación y borrador local automático.
- Sharing público corto con vigencia de 90 días.
- Plantel/minutos persistentes, reloj correcto, carga masiva, titulares y cambio sugerido.
- PWA sin cachear APIs privadas.
- Lint, tests, build, presupuesto de 50 KB gzip y smoke E2E verdes.

## Producción

Configurar `.env.example`, volumen para SQLite/uploads, Stripe webhook y Resend. Migrar a Postgres antes de múltiples réplicas. Rotar secretos que hayan existido en el historial Git.

Leer `README.md` y `UX_DT_INFERIORES.md`.
