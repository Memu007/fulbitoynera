# Worklog — Pizarra Pro (táctica de fútbol)

Proyecto: integrar la pizarra táctica de fútbol (HTML standalone `pizarra-pro.html`)
en el Next.js 16 existente como página principal `/`.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Leer el HTML subido, planear la integración en Next.js y preparar el worklog.

Work Log:
- Leí `/home/z/my-project/upload/pizarra-pro.html` (1428 líneas, ~59KB).
- Es una app de canvas autocontenida: modos F5/F8/F11, formaciones, grabación
  con timestamps, reproducción interpolada Catmull-Rom, IA que "completa" la
  jugada respetando lo grabado, posesión de pelota, estelas, dibujo de flechas,
  jugadas guardadas en memoria.
- Revisé la estructura del Next.js: `src/app/page.tsx` es placeholder del logo.
  `layout.tsx` tiene metadata genérica. Hay shadcn/ui disponible.
- Decisión: crear `src/components/tactical-board.tsx` (client component) con la
  estructura HTML como JSX y toda la lógica vanilla transcrita a un `useEffect`
  que opera sobre el DOM por IDs (igual que el original). Esto preserva toda la
  funcionalidad probada sin reimplementar en React puro.

Stage Summary:
- Plan: 1 componente cliente `TacticalBoard` + `page.tsx` que lo renderiza.
- Se mantiene el HTML/CSS/JS del original casi intacto (solo JSX + useEffect).
- Próximo: crear el componente y reemplazar page.tsx.

---
Task ID: 2-7
Agent: main (Z.ai Code)
Task: Integrar la pizarra al Next.js, verificar funcionamiento y mejora de persistencia.

Work Log:
- Copié `pizarra-pro.html` a `public/pizarra-pro.html` para servirse como asset estático.
- `src/app/page.tsx`: ahora carga el HTML en un `<iframe>` a pantalla completa
  (position:fixed, inset:0, 100dvh). Preserva toda la lógica de canvas probada.
- `src/app/layout.tsx`: metadata actualizada a "Pizarra Pro — Táctica de fútbol con IA".
- Mejora implementada sobre el HTML: persistencia de jugadas en `localStorage`
  (clave `pizarraPro.saved.v1`). Antes las jugadas guardadas se perdían al recargar;
  ahora sobreviven. Se cargan en init() y se persisten al guardar/eliminar.
- Dev server levantó sin errores en puerto 3000.
- Verificación con Agent Browser (viewport móvil 390x844):
  * Carga OK, sin errores de consola, título correcto.
  * Canvas renderiza cancha verde + líneas + 11 jugadores (5 azul + 5 rojo + pelota).
  * Onboarding se cierra con el botón.
  * Flujo grabar → detener → reproducir → pausar → continuar → detener: OK.
  * IA `completePlay()`: respeta lo grabado (ballPreservada=true), genera 11 tracks,
    detecta equipo atacante.
  * Vista previa IA: barra "Tu jugada / Con IA" + botón Aplicar, estelas visibles.
  * Persistencia: jugada guardada sobrevive al reload (saved=1 antes y después).
- Verificación visual con VLM (glm-4.6v) sobre screenshots: confirmó cancha,
  jugadores, controles, barra de IA y estelas todo renderizado correctamente.

Stage Summary:
- App integrada y funcionando en `/`. Usuario puede verla en el Preview Panel.
- Las 3 mejoras que pidió el usuario (velocidad, detener play, IA según lo grabado)
  YA estaban resueltas en el HTML que me pasó de la otra IA — verificadas.
- Mejora adicional entregada: jugadas persisten en el dispositivo (localStorage).
- Listo para seguir iterando: más estilos de IA, exportar jugadas, velocidad 8x, etc.

---
Task ID: 8
Agent: main (Z.ai Code)
Task: Implementar 5 mejoras en loop: modo loop, 8x, undo, export GIF, onboarding corto.

Work Log:
- Mejora 1 — Modo loop (🔁): botón en la scrubRow. Al terminar la reproducción
  reinicia solo si S.loop=true. Toggle con highlight ámbar.
- Mejora 2 — Velocidad 8x "Relámpago": añadida a SPEEDS.
- Mejora 3 — Deshacer (↶): botón flotante que aparece solo durante grabación.
  pushUndo() hace snapshot de tracks+duration+carrier al iniciar cada drag.
  undoRec() restaura el último snapshot. Stack de hasta 30 niveles.
- Mejora 4 — Exportar GIF (🎬): usa gif.js. Descargué gif.js + gif.worker.js a
  public/ (same-origin, evita error CORS de Web Worker desde CDN). Genera
  frames a 14fps escalados a 360px de ancho, descarga pizarra-pro-jugada.gif.
  Verificado: blob de 142KB tipo image/gif generado correctamente.
- Mejora 5 — Onboarding de 4→3 pasos más conciso. Botón ❔ siempre accesible.
- Verificación Agent Browser: loop reinicia solo, 8x reproduce veloz, undo
  revierte el último movimiento manteniendo los anteriores (tracks 2→1,
  duration restaurada), GIF se genera sin errores.

Stage Summary:
- 5 mejoras verificadas y funcionando.
- Archivos nuevos en public/: gif.js, gif.worker.js.
- pizarra-pro.html ahora tiene 🔁 loop, ⚡⚡ 8x, ↶ deshacer, 🎬 exportar GIF.
- Listo para próxima iteración según respuestas del usuario sobre monetización.

---
Task ID: 9
Agent: main (Z.ai Code)
Task: Investigar bugs de pelota y animación, aplicar fixes de calidad profesional.

Work Log:
- Investigación online (12 búsquedas, 9 páginas leídas): técnicas de pizarras
  tácticas pro, Catmull-Rom centripetal, RDP, parent-child ball, performance canvas.
- Diagnóstico de bugs:
  * Bug pelota: carrier solo se asignaba en endPtr, no durante el arrastre. Si
    moves un jugador sobre la pelota suelta, no la tomaba. Radio attachR chico.
  * Bug animación: Catmull-Rom UNIFORM (α=0) produce overshoot/loops cuando
    el jugador frena (puntos a distancias desiguales). Sin safety de NaN.
  * Bug trayectoria: muestreo crudo a 60Hz del dedo = 100+ puntos con jitter.
- Fix 1 — Pelota parent-child:
  * attachR aumentado a playerR()*2.4/W (más fácil con el dedo).
  * hit() reescrito: si tocás pelota y no hay jugador muy cerca, la agarrás.
  * En pointermove, si jugador sin pelota pisa pelota suelta → attachBall()
    al instante (no solo al soltar).
  * ballAtFoot con offset constante (pie del jugador mirando al arco rival).
  * Verificado: drift constante 0.042 durante drag completo (no creciente).
- Fix 2 — Catmull-Rom CENTRIPETAL (α=0.5):
  * Implementación completa según Yuksel 2011, forma cerrada de Three.js.
  * Safety para puntos repetidos (dt < 1e-5 → usar vecino, evita NaN).
  * Extremos por reflexión (p_{-1}=2·p0−p1) para tangente natural.
  * Verificado: rango y [0.150, 0.517] sobre keyframes [0.15, 0.50] = sin
    overshoot (uniform daba >0.55 en el mismo caso).
- Fix 3 — Simplificación RDP (Ramer-Douglas-Peucker):
  * Al stopRec, cada track se simplifica con ε=0.012 (1.2% del campo).
  * Movimiento recto: 30 samples → 2 keyframes. Movimiento curvo: 40 samples
    → 5 keyframes (conserva curvatura).
  * Catmull-Rom interpola los keyframes limpios = trayectoria suave.
- Verificación Agent Browser con pointer events reales:
  * Drag pelota→jugador: carrier asignado, pelota en el pie. ✓
  * Drag jugador con pelota: drift 0.042 constante, no se despega. ✓
  * Reproducción: pelota avanza de (0.5,0.5)→(0.45,0.70)→(0.40,0.81) suave. ✓
  * Sin errores de consola.

Stage Summary:
- 3 bugs críticos resueltos con técnicas profesionales (no parches).
- Pelota ahora se queda pegada al jugador y lo sigue durante el arrastre.
- Animación sin overshoot (centripetal) y sin jitter (RDP).
- Listo para próxima iteración: modelo keyframes+paths editables, capas canvas,
  más estilos IA, monetización.
