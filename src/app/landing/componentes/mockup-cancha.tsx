'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { C } from '../constantes'

// Dibuja una cancha de fútbol 5 con jugadores, pelota y flechas de jugada.
// Animación sutil: la pelota viaja por un camino y hay un resplandor pulsante en el jugador con la pelota.
export function MockupCancha() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = 640
    const H = 420
    c.width = W * DPR
    c.height = H * DPR
    c.style.width = '100%'
    c.style.height = 'auto'
    ctx.scale(DPR, DPR)

    // posiciones de jugadores (en coords 0..1, x=horizontal, y=vertical)
    // Azul ataca hacia la derecha (x creciente), Rojo defiende.
    const blue = [
      { x: 0.18, y: 0.5 }, // arquero
      { x: 0.34, y: 0.28 },
      { x: 0.34, y: 0.72 },
      { x: 0.52, y: 0.4 },
      { x: 0.52, y: 0.6 },
    ]
    const red = [
      { x: 0.82, y: 0.5 },
      { x: 0.66, y: 0.28 },
      { x: 0.66, y: 0.72 },
      { x: 0.48, y: 0.32 },
      { x: 0.48, y: 0.68 },
    ]
    // camino de la pelota: pase del #4 azul al #5 azul (centro)
    const ballPath = [
      { x: 0.52, y: 0.4 },
      { x: 0.62, y: 0.5 },
      { x: 0.7, y: 0.55 },
    ]
    // flecha IA: movimiento sugerido del #5 azul al hueco
    const aiArrow = { from: { x: 0.52, y: 0.6 }, to: { x: 0.72, y: 0.62 } }

    const lighten = (hex: string, amt: number) => {
      const n = parseInt(hex.slice(1), 16)
      const r = Math.min(255, (n >> 16) + Math.round(255 * amt))
      const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt))
      const b = Math.min(255, (n & 0xff) + Math.round(255 * amt))
      return `rgb(${r},${g},${b})`
    }

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, dashed: boolean) => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 3
      if (dashed) ctx.setLineDash([7, 5])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
      // punta
      const ang = Math.atan2(y2 - y1, x2 - x1)
      const ah = 10
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4))
      ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawPlayer = (x: number, y: number, color: string, hasBall: boolean, t: number) => {
      const r = 14
      // sombra
      ctx.beginPath()
      ctx.ellipse(x, y + r + 3, r * 0.9, r * 0.35, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fill()
      // glow si tiene pelota
      if (hasBall) {
        const pulse = 0.6 + 0.4 * Math.sin(t / 400)
        ctx.beginPath()
        ctx.arc(x, y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,191,36,${0.18 * pulse})`
        ctx.fill()
      }
      // cuerpo
      const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r)
      g.addColorStop(0, lighten(color, 0.25))
      g.addColorStop(1, color)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      // borde blanco
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.stroke()
      // highlight
      ctx.beginPath()
      ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fill()
    }

    const drawBall = (x: number, y: number, t: number) => {
      const r = 7
      // sombra
      ctx.beginPath()
      ctx.ellipse(x, y + r + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fill()
      // glow
      const pulse = 0.5 + 0.5 * Math.sin(t / 300)
      ctx.beginPath()
      ctx.arc(x, y, r + 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(251,191,36,${0.25 * pulse})`
      ctx.fill()
      // balón
      const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r)
      g.addColorStop(0, '#FFF7CC')
      g.addColorStop(1, C.amber)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.stroke()
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      // césped con franjas
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? C.chalk : C.chalkDark
        ctx.fillRect((W / 10) * i, 0, W / 10, H)
      }
      // viñeta
      const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75)
      grd.addColorStop(0, 'rgba(0,0,0,0)')
      grd.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      // líneas de tiza
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = 2
      ctx.strokeRect(16, 16, W - 32, H - 32)
      // línea de medio campo
      ctx.beginPath()
      ctx.moveTo(W / 2, 16)
      ctx.lineTo(W / 2, H - 16)
      ctx.stroke()
      // círculo central
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 48, 0, Math.PI * 2)
      ctx.stroke()
      // áreas
      ctx.strokeRect(16, H / 2 - 70, 70, 140)
      ctx.strokeRect(W - 86, H / 2 - 70, 70, 140)

      // flecha IA (trazada, menta) — primero para que quede debajo
      drawArrow(aiArrow.from.x * W, aiArrow.from.y * H, aiArrow.to.x * W, aiArrow.to.y * H, C.accent, true)

      // pelota viajando
      const cycle = (t / 2600) % 1
      const seg = cycle * (ballPath.length - 1)
      const i = Math.floor(seg)
      const f = seg - i
      const a = ballPath[i]
      const b = ballPath[Math.min(i + 1, ballPath.length - 1)]
      const bx = (a.x + (b.x - a.x) * f) * W
      const by = (a.y + (b.y - a.y) * f) * H

      // jugadores azules
      blue.forEach((p, idx) => drawPlayer(p.x * W, p.y * H, C.blue, idx === 3, t))
      // jugadores rojos
      red.forEach((p) => drawPlayer(p.x * W, p.y * H, C.red, false, t))

      // pelota
      drawBall(bx, by, t)

      // etiqueta "IA" sobre la flecha
      ctx.fillStyle = C.accent
      ctx.font = '700 11px Inter, sans-serif'
      ctx.fillText('✨ IA', aiArrow.to.x * W + 10, aiArrow.to.y * H - 6)
    }

    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      draw(now - start)
      raf = requestAnimationFrame(loop)
    }
    if (reduce) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border shadow-2xl"
      style={{
        borderColor: C.line,
        background: C.chalkDark,
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,211,166,0.15)',
      }}
    >
      <canvas ref={ref} className="block w-full" />
      {/* badge flotante "IA completando" */}
      <div
        className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur"
        style={{ background: 'rgba(14,20,22,0.7)', color: C.accent, border: `1px solid ${C.accent}` }}
      >
        <Sparkles size={13} />
        IA completando jugada…
      </div>
    </div>
  )
}
