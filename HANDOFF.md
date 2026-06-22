# HANDOFF — Pizarra Pro (app de pizarra táctica de fútbol con IA)

Documento para la próxima AI que tome el proyecto. Última verificación: todo funcional, sin errores.

---

## 1. Qué es

App web (PWA) de pizarra táctica de fútbol con IA que completa jugadas. Target: entrenadores de fútbol 5/8/11 en Latam. Modelo: freemium (Free con límites + Pro $2.499/año ARS + Club $199/año).

Stack: **Next.js 16 + App Router + TypeScript + Tailwind CSS 4**. La app principal vive en `/public/pizarra-pro.html` (HTML standalone con canvas + JS vanilla) y se incrusta vía iframe en `src/app/page.tsx`. Landing comercial en `/landing`.

---

## 2. Estructura de archivos

```
/home/z/my-project/
├── public/
│   ├── pizarra-pro.html      # LA APP (2700+ líneas, todo el JS inline)
│   ├── templates.js          # 12 plantillas de jugadas (F5/F8/F11)
│   ├── gif.js                # Librería para exportar GIF (vendored)
│   ├── gif.worker.js         # Worker de gif.js (vendored)
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker (offline)
│   ├── icon-192.png          # Iconos PWA
│   ├── icon-512.png
│   ├── icon-180.png          # apple-touch-icon
│   └── icon-1024.png
├── src/app/
│   ├── page.tsx              # Incrusta pizarra-pro.html en iframe fullscreen
│   ├── layout.tsx            # Metadata + Toaster
│   ├── globals.css           # Tailwind + shadcn/ui
│   ├── landing/page.tsx      # Landing comercial (componente cliente, ~720 líneas)
│   └── api/checkout/route.ts # Endpoint Stripe (demo + producción)
├── worklog.md                # Historial completo de tareas (leelo!)
└── HANDOFF.md                # Este documento
```

---

## 3. Features implementados (TODOS verificados funcionando)

### Pizarra y animación
- ✅ Fútbol 5/8/11 con formaciones reales (1-2-1, 4-3-3, etc.)
- ✅ Cancha tipo broadcast (rayas de corte + degradado stadium)
- ✅ Jugadores con gradiente 3D, sombra, highlight (puntaje VLM 7.5/10)
- ✅ Grabación con interpolación Catmull-Rom **centripetal** (sin overshoot)
- ✅ Simplificación de tracks con Douglas-Peucker al grabar
- ✅ Dinamismo: easing easeInOutQuad + flechas de dirección + bob vertical + spin de pelota
- ✅ Focus mode (UI atenuada durante play/pause)
- ✅ Velocidades 0.5x, 1x, 2x, 4x, 8x + loop 🔁
- ✅ Modo presentación (pantalla completa para vestuario)

### IA (el diferenciador clave, ningún competidor lo tiene)
- ✅ 7 estilos: Equilibrado, Ofensivo, Bandas, Defensivo, Contraataque, Presión alta, Salida desde arco
- ✅ Respeta lo grabado (no deforma la jugada del usuario)
- ✅ Vista previa "Tu jugada vs Con IA" antes de aplicar
- ✅ Feature gating: 1 jugada IA/día en Free, ilimitada en Pro

### Gestión de jugadas
- ✅ Guardar/cargar/eliminar jugadas (localStorage)
- ✅ **Duplicar jugada** (botón ⧉ para variantes rápidas)
- ✅ 12 plantillas prearmadas (3 F5, 3 F8, 6 F11)
- ✅ Exportar a GIF (para WhatsApp)
- ✅ Compartir por link (base64 en URL, auto-reproduce)
- ✅ Dibujo de flechas (lápiz ✏️ con 2 colores, deshacer)

### Control de partido (inferiores)
- ✅ Control de minutos jugados con timer
- ✅ Vista de equidad (badges OK/BAJO/POCO + sugerencias automáticas)
- ✅ **Compartir plantel a WhatsApp** (texto plano con emojis de equidad)
- ✅ Persiste en localStorage

### Jugadores
- ✅ **Doble-tap** = pelota vuela al pie (rápido)
- ✅ **Mantener presionado** = editar (nombre, número, **foto/avatar**)
- ✅ Foto de jugador enmascarada en círculo, con borde del color del equipo
- ✅ Posesión de pelota (parent-child: la pelota sigue al carrier)

### Auth y monetización
- ✅ Auth demo (login/registro/recuperar) en localStorage
- ✅ Sesión persiste tras reload
- ✅ User pill + menú desplegable (Mis jugadas, Mi plan, Cerrar sesión)
- ✅ Paywall con 3 planes (Pro Anual, Pro Mensual, Club)
- ✅ Stripe checkout API (`/api/checkout`) — modo demo hoy, real con `STRIPE_SECRET_KEY`
- ✅ Feature gating Free vs Pro funcional

### PWA
- ✅ Instalable en Android (manifest + service worker)
- ✅ Offline (SW cachea el shell)
- ✅ Prompt de instalación automático (8s)
- ✅ Iconos 192/512/1024

### Landing comercial
- ✅ `/landing` con hero, features, pricing, testimonial, footer
- ✅ Dark mode pro, mobile-first
- ✅ VLM 8/10 profesionalismo

---

## 4. Estado técnico

- **Dev server:** corriendo en puerto 3000, sin errores
- **ESLint:** limpio (3 warnings en gif.js/gif.worker.js son vendored, ignorar)
- **VLM puntaje profesionalismo:** 7.5/10 (vs TacticalPad 8/10, Coach Tactic Board 8/10)
- **Performance:** canvas 2D, no testeado en Android gama baja (RIESGO)

---

## 5. Configuración para producción

Para activar pagos reales, agregar al `.env`:
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Deploy: Vercel (conectar repo, gratis). Dominio propio recomendado.

---

## 6. Lo que NO está hecho (huecos conocidos)

### Bloqueantes para monetización seria
1. **Auth es demo** — localStorage no es seguro. Migrar a Supabase Auth (1-2 días)
2. **Sync en la nube** — las jugadas están solo en localStorage. Necesita backend (Supabase)
3. **Testeo en Android gama baja** — puede trabarse (canvas 2D redraw completo)

### Mejoras de producto (prioridad media)
4. Onboarding guiado interactivo (hoy son 3 pasos estáticos)
5. Más plantillas (12 vs 47 de Coach Tactic Board)
6. Gestión de plantel por equipo (multi-equipo real)
7. Conos/vallas/escaleras (módulo entrenamiento)
8. PDF para imprimir
9. Zoom/pinch en cancha
10. Video MP4 (no solo GIF)

### Mejoras de diseño (para 9/10)
11. Modo 3D opcional (TacticalPad tiene 3D, nosotros 2D)
12. Sombras dinámicas en fichas
13. UI más sutil en modo full-screen

### Features grandes (futuro)
14. Colaboración real-time (WebSocket + backend)
15. Video analysis (dibujar sobre video)
16. Trusted Web Activity para Google Play

---

## 7. Decisiones de diseño importantes

- **Paleta:** dark mode #0E1416 / #161D21 / #1F282D, accent menta #22D3A6, balón ámbar #FBBF24, azul #3B82F6 / rojo #EF4444 equipos
- **Tipografía:** Inter (Google Fonts)
- **Sin indigo/azul como primario** (regla del proyecto)
- **Footer sticky** en landing (mt-auto en flex-col min-h-screen)
- **La app vive en HTML standalone** (no React) para preservar toda la lógica de canvas probada
- **z-ai-web-dev-sdk solo en backend** (regla del proyecto)

---

## 8. Cómo probar

Preview Panel → `/` (app) o `/landing` (landing).

Flujos clave:
1. Grabar jugada → reproducir → IA
2. 📂 Mis jugadas → duplicar (⧉)
3. ⏱️ Control de minutos → 📤 WhatsApp
4. Mantener presionado jugador → subir foto
5. 👤 Login → registrar → recargar (persiste)
6. 🖥️ Modo presentación

---

## 9. Worklog

`/home/z/my-project/worklog.md` tiene el historial completo de 30 tasks. Lelo si necesitás contexto de por qué se tomó cada decisión.

---

**Estado final:** Producto funcional, monetizable a $2-5/mes en Latam con la IA como diferenciador. Listo para handoff.
