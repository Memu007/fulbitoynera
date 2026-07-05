'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, ShieldCheck } from 'lucide-react'
import { C } from '../constantes'

export function Planes() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'para siempre',
      desc: 'Para probar la pizarra y la IA sin compromiso.',
      cta: 'Empezar',
      featured: false,
      sub: '',
      features: [
        { t: 'Pizarra completa (F5, F8, F11)', on: true },
        { t: '3 jugadas guardadas', on: true },
        { t: '1 IA por día', on: true },
        { t: 'Exportar a GIF', on: false },
        { t: 'IA ilimitada', on: false },
        { t: 'Modo presentación', on: false },
      ],
    },
    {
      name: 'Pro Anual',
      price: '$2.499',
      period: '/año',
      desc: 'Para el DT que usa la pizarra cada semana. Todo desbloqueado.',
      cta: 'Probar 7 días gratis',
      featured: true,
      badge: 'MÁS POPULAR',
      sub: '7 días gratis · después $2.499/año',
      features: [
        { t: 'Todo lo de Free', on: true },
        { t: 'IA ilimitada', on: true },
        { t: 'Jugadas ilimitadas', on: true },
        { t: 'Exportar a GIF sin marca', on: true },
        { t: 'Modo presentación', on: true },
        { t: 'Velocidad 8x “Relámpago”', on: true },
      ],
    },
    {
      name: 'Club',
      price: '$199',
      period: '/año por entrenador',
      desc: 'Para escuelitas y clubes con varios DTs y biblioteca compartida.',
      cta: 'Empezar',
      featured: false,
      sub: 'Mínimo 5 entrenadores',
      features: [
        { t: 'Todo lo de Pro', on: true },
        { t: 'Hasta 5 entrenadores', on: true },
        { t: 'Biblioteca de jugadas compartida', on: true },
        { t: 'Etiquetado por categoría', on: true },
        { t: 'Soporte prioritario', on: true },
        { t: 'Factura A/B', on: true },
      ],
    },
  ]

  return (
    <section id="planes" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Planes
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Empezá gratis. Mejorate cuando te sirva.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: C.muted }}>
            Precios en pesos argentinos. Sin sorpresas, cancelás cuando quieras.
          </p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative flex flex-col rounded-2xl border p-6 transition-all hover:scale-[1.02]"
              style={{
                borderColor: p.featured ? C.accent : C.line,
                background: p.featured ? `linear-gradient(180deg, ${C.accent}12, ${C.surface2})` : C.surface2,
                boxShadow: p.featured ? `0 16px 48px -12px ${C.accent}33` : 'none',
              }}
            >
              {p.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: C.accent, color: C.bg }}
                >
                  {p.badge}
                </div>
              )}
              <h3 className="text-lg font-extrabold" style={{ color: C.text }}>
                {p.name}
              </h3>
              <p className="mt-1 text-sm" style={{ color: C.muted }}>
                {p.desc}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight" style={{ color: C.text }}>
                  {p.price}
                </span>
                <span className="text-sm font-medium" style={{ color: C.muted }}>
                  {p.period}
                </span>
              </div>
              {p.sub && (
                <p className="mt-1 text-xs font-semibold" style={{ color: p.featured ? C.accent : C.muted }}>
                  {p.sub}
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f.t} className="flex items-start gap-2.5 text-sm">
                    {f.on ? (
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: C.accent }} />
                    ) : (
                      <X size={16} className="mt-0.5 shrink-0" style={{ color: C.muted, opacity: 0.5 }} />
                    )}
                    <span style={{ color: f.on ? C.text : C.muted, opacity: f.on ? 1 : 0.6 }}>
                      {f.t}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
                style={
                  p.featured
                    ? { background: C.accent, color: C.bg, boxShadow: `0 6px 22px ${C.accent}40` }
                    : { background: C.surface, color: C.text, border: `1px solid ${C.line}` }
                }
              >
                {p.cta}
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs" style={{ color: C.muted }}>
          <ShieldCheck size={14} style={{ color: C.accent }} />
          Pago seguro · Cancelás cuando quieras · Sin renovación sorpresa
        </p>
      </div>
    </section>
  )
}
