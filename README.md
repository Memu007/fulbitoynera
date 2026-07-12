# Pizarra Pro

PWA táctica para entrenadores de fútbol 5, 8 y 11, con foco en inferiores: preparar y mostrar jugadas, controlar minutos y compartir con el plantel.

## Recorrido del DT

- Inicio por tarea: **Preparar jugada**, **Controlar partido**, **Plantillas** o **Mis jugadas**.
- En móvil se muestran sólo los accesos esenciales; el resto vive en 🏠 Inicio.
- Borrador automático separado por usuario/invitado y recuperación después de una recarga.
- Control de partido con carga masiva del plantel, marcado de titulares y cambio sugerido por minutos.
- Enlaces cortos Pro/Club que abren sin cuenta, conservan jugadores y reproducen automáticamente.

## Canchas

| Modalidad | Preset |
|---|---:|
| Futsal/F5 | 40 × 20 m |
| F8 | 60 × 45 m, configurable |
| F11 | 105 × 68 m |

F8 no posee una única medida internacional universal. Las referencias F5 y F11 siguen las reglas AFA/FIFA e IFAB.

## Desarrollo

Requiere Node 20.19 LTS.

```bash
cp .env.example .env
npm ci
npm run db:sync
npm run dev
```

## Control de calidad

```bash
npm run lint
npm test
npm run check:budget
npm run build
```

El cliente principal tiene un presupuesto de 75 KB gzip. `npm run test:smoke` prueba auth, límite Free, upgrade y sharing contra una instancia en `127.0.0.1:3100`.

## Producción

SQLite y `UPLOAD_DIR` requieren volumen persistente. `npm run start` aplica migraciones antes de levantar el servidor standalone. Para varias réplicas, migrar a Postgres y almacenamiento de objetos.
