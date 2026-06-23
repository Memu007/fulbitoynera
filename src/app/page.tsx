'use client'

/**
 * Pizarra Pro — app de táctica de fútbol.
 *
 * La lógica (canvas, grabación, reproducción interpolada, IA que completa la
 * jugada, posesión de pelota, dibujo de flechas, jugadas guardadas) vive en
 * `/public/pizarra-pro.html` como app autocontenida. La cargamos en un iframe
 * a pantalla completa: así preservamos toda la funcionalidad probada y desde
 * aquí podemos seguir iterando el HTML.
 *
 * El iframe ocupa exactamente el viewport (sin scroll) y deja que la app
 * maneje su propio layout mobile-first (100dvh, overflow hidden).
 */
export default function Home() {
  return (
    <iframe
      src="/pizarra-pro.html"
      title="Pizarra Pro — Táctica de fútbol"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        border: 'none',
        display: 'block',
        margin: 0,
        padding: 0,
      }}
      allow="clipboard-write"
    />
  )
}
