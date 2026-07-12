# Evaluación como DT de inferiores

## Diagnóstico

El tablero era potente, pero la primera pantalla exponía demasiadas herramientas al mismo nivel. En un entrenamiento o partido eso obliga a interpretar íconos mientras los chicos esperan. El control de minutos tenía valor, aunque cargar jugadores de a uno y decidir cambios manualmente lo volvía lento. También faltaba una red de seguridad clara ante una recarga o cierre accidental.

## Cambios aplicados

1. **Menos decisiones al entrar:** inicio por objetivo y hub 🏠 permanente.
2. **Móvil más limpio:** se ocultan accesos secundarios sin eliminarlos.
3. **Menos carga administrativa:** se puede pegar todo el plantel, marcar F5/F8/F11 titulares y aplicar el cambio sugerido.
4. **Trabajo protegido:** borrador automático por cuenta y guardado local de partidos invitados.
5. **Compartir confiable:** URL corta, pública, con autoplay y fallback de portapapeles.
6. **Rendimiento medible:** módulo legado retirado y presupuesto automático; cliente actual cercano a 50 KB gzip sin el codificador GIF.
7. **Onboarding breve:** bajó de siete a cuatro pasos orientados a una primera jugada.

## Evaluación actual

- **Facilidad:** buena para empezar y muy buena para repetir tareas habituales.
- **Utilidad:** alta en entrenamientos y ahora también en el banco durante partidos.
- **Performance:** liviana para red móvil; el riesgo restante es el canvas/GIF en Android físicos de gama baja.

## Validación pendiente fuera del entorno automatizado

- Gestos con una sola mano en Android e iPhone reales.
- Mantener un partido abierto 60–90 minutos con pantalla bloqueada/desbloqueada.
- Exportar GIF de una jugada larga en un teléfono con poca memoria.
- Probar `navigator.share` con WhatsApp instalado.
