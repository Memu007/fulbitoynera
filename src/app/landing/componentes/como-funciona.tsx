'use client'

import { motion } from 'framer-motion'
import { PencilLine, Bot, Share2 } from 'lucide-react'
import { C } from '../constantes'

export function ComoFunciona() {
  const steps = [
    {
      icon: PencilLine,
      n: '1',
      title: 'Dibujá tu jugada',
      body: 'Arrastrá jugadores y pelota como en una pizarra real. Grabá cada movimiento con su tiempo. Fútbol 5, 8 u 11 con formaciones reales.',
    },
    {
      icon: Bot,
      n: '2',
      title: 'La IA completa el resto',
      body: 'No dibujes a 22 jugadores. La IA simula cómo se mueve el rival y cómo continúan tus compañeros a partir de lo que grabaste.',
    },
    {
      icon: Share2,
      n: '3',
      title: 'Reproducí, exportá y compartí',
      body: 'Velocidad de 0.5x a 8x, modo loop, exportá a GIF y mandalo por WhatsApp al plantel. O activá Modo Presentación para el vestuario.',
    },
  ]

  return (
    <section id="como-funciona" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Cómo funciona
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Tres pasos. Listo para el entretiempo.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: C.muted }}>
            Diseñado para que un DT arme una jugada en menos de un minuto, sin manuales.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative rounded-2xl border p-6 transition-all hover:scale-[1.02]"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${C.accent}1F`, color: C.accent, border: `1px solid ${C.accent}55` }}
                >
                  <s.icon size={22} />
                </span>
                <span className="text-4xl font-black" style={{ color: `${C.accent}33` }}>
                  {s.n}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: C.text }}>
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
