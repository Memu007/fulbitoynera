'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Check } from 'lucide-react'
import { C } from '../constantes'
import { MockupCancha } from './mockup-cancha'

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
      {/* glow background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(800px 400px at 70% 0%, ${C.accent}1A, transparent 70%), radial-gradient(600px 300px at 10% 20%, ${C.blue}12, transparent 70%)`,
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: `${C.accent}1F`, color: C.accent, border: `1px solid ${C.accent}55` }}
          >
            <Sparkles size={13} />
            La primera pizarra táctica con IA que completa la jugada
          </div>

          <h1
            className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: C.text }}
          >
            Táctica de fútbol con IA.{' '}
            <span style={{ color: C.accent }}>Dibujá, la IA completa.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: C.muted }}>
            Grabá tu jugada, dejá que la IA simule cómo responde el rival. Para entrenadores de
            fútbol 5, 8 y 11. En tu celu, sin instalar nada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all hover:scale-[1.03] active:scale-95"
              style={{
                background: C.accent,
                color: C.bg,
                boxShadow: `0 8px 28px ${C.accent}40`,
              }}
            >
              Probar gratis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#planes"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all hover:scale-[1.03] hover:bg-white/5 active:scale-95"
              style={{ color: C.text, border: `1px solid ${C.line}`, background: C.surface }}
            >
              Ver planes
            </a>
          </div>

          {/* trust line */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium" style={{ color: C.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Sin registro
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Funciona offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} style={{ color: C.accent }} /> Hecho en Argentina 🇦🇷
            </span>
          </div>
        </motion.div>

        {/* Right: mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <MockupCancha />
          {/* stats below mockup */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { v: '5·8·11', l: 'Fútbol' },
              { v: '0.5–8x', l: 'Velocidades' },
              { v: 'GIF', l: 'Exportá y compartí' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: C.line, background: C.surface }}
              >
                <div className="text-base font-extrabold sm:text-lg" style={{ color: C.accent }}>
                  {s.v}
                </div>
                <div className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
