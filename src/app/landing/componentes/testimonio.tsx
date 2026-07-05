'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { C } from '../constantes'

export function Testimonio() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border p-8 sm:p-12"
          style={{
            borderColor: C.line,
            background: `linear-gradient(135deg, ${C.surface2}, ${C.surface})`,
          }}
        >
          {/* comilla gigante */}
          <div
            className="pointer-events-none absolute right-6 top-2 select-none font-black leading-none"
            style={{ color: `${C.accent}22`, fontSize: '120px' }}
          >
            ”
          </div>

          <div className="mb-5 flex gap-1" style={{ color: C.amber }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} fill="currentColor" stroke="none" />
            ))}
          </div>

          <blockquote
            className="relative text-xl font-semibold leading-relaxed sm:text-2xl"
            style={{ color: C.text }}
          >
            “Lo uso para explicar ajustes al entretiempo. La IA me muestra variantes que no había
            pensado.”
          </blockquote>

          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
              style={{ background: `${C.accent}22`, color: C.accent, border: `1px solid ${C.accent}55` }}
            >
              MJ
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: C.text }}>
                Mariano J.
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                DT de juveniles · Buenos Aires
              </div>
            </div>
            <span
              className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: `${C.amber}22`, color: C.amber }}
            >
              Usuario Pro
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
