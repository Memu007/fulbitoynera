'use client'

/**
 * Pizarra Pro — Landing comercial.
 *
 * Vive en /landing para no pisar la app principal (que está en / vía iframe).
 * Es una página de venta: copy persuasivo, dark mode profesional, paleta de la
 * app (menta #22D3A6 como acento, NO indigo/azul como primario).
 *
 * Estructura:
 *   1. Sticky header (logo + Probar gratis)
 *   2. Hero (headline + 2 CTAs + mockup de cancha en canvas)
 *   3. Cómo funciona (3 pasos)
 *   4. Features (grid de 6)
 *   5. Diferenciador (vs TacticalPad / Coach Tactic Board)
 *   6. Pricing (3 planes, central destacado)
 *   7. Testimonial (placeholder)
 *   8. Footer (links + copyright + Hecho en Argentina 🇦🇷)
 */

import { Inter } from 'next/font/google'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Brain,
  Trophy,
  Film,
  Repeat,
  MonitorDown,
  HardDrive,
  Check,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  PencilLine,
  Bot,
  Share2,
  Zap,
  Star,
  ShieldCheck,
} from 'lucide-react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

/* ─────────────────────────  PALETA  ───────────────────────── */
const C = {
  bg: '#0E1416',
  surface: '#161D21',
  surface2: '#1F282D',
  line: 'rgba(255,255,255,0.08)',
  text: '#E8EDF0',
  muted: '#9AA7AD',
  accent: '#22D3A6', // menta — CTA
  accentDark: '#0F9D77',
  amber: '#FBBF24',
  blue: '#3B82F6',
  red: '#EF4444',
  chalk: '#1E5E3A',
  chalkDark: '#173F2A',
} as const

/* ─────────────────────────  HERO  ─────────────────────────── */
function Hero() {
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
          <FieldMockup />
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

/* ────────────────────  CÓMO FUNCIONA  ─────────────────────── */
function HowItWorks() {
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

/* ──────────────────────  FEATURES  ────────────────────────── */
function Features() {
  const items = [
    { icon: Brain, title: 'IA que simula al rival', body: 'No más “y si el marcador hace esto…”. La IA mueve al rival y a tus compañeros desde lo que grabaste.' },
    { icon: Trophy, title: 'Fútbol 5, 8 y 11', body: 'Formaciones reales por modalidad. Cambiá con un toque, la cancha se adapta sola.' },
    { icon: Film, title: 'Exportar a GIF', body: 'Generá un GIF liviano y mandalo por WhatsApp. Llega a todo el plantel en un toque.' },
    { icon: Repeat, title: 'Reproducción con loop y velocidades', body: 'De 0.5x para analizar hasta 8x “Relámpago”. Loop automático para repasar.' },
    { icon: MonitorDown, title: 'Modo presentación para vestuario', body: 'Pantalla completa, sin botones, auto-loop. Conectá el celu al monitor y al vestuario.' },
    { icon: HardDrive, title: 'Jugadas guardadas en tu dispositivo', body: 'Tus jugadas viven en tu celu. Sin cuenta, sin nube, sin que se te olviden las claves.' },
  ]
  return (
    <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24" style={{ background: C.surface }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Features
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            Todo lo que un DT necesita. Nada que estorbe.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="group rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:border-white/15"
              style={{ borderColor: C.line, background: C.surface2 }}
            >
              <span
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${C.accent}1F`, color: C.accent }}
              >
                <f.icon size={22} />
              </span>
              <h3 className="mb-1.5 text-base font-bold" style={{ color: C.text }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────  DIFERENCIADOR  ──────────────────────── */
function Differentiator() {
  const rows = [
    { f: 'IA que completa la jugada', us: true, them: false },
    { f: 'Fútbol 5, 8 y 11 en una app', us: true, them: 'Parcial' },
    { f: 'Exportar a GIF para WhatsApp', us: true, them: 'Parcial' },
    { f: 'Modo presentación vestuario', us: true, them: false },
    { f: 'Funciona offline en el celu', us: true, them: false },
    { f: 'Precio Latam (PPP)', us: true, them: false },
  ]
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Por qué Pizarra Pro
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.text }}>
            No dibujes a 22 jugadores. Dibujá los tuyos.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed" style={{ color: C.muted }}>
            A diferencia de <strong style={{ color: C.text }}>TacticalPad</strong> o{' '}
            <strong style={{ color: C.text }}>Coach Tactic Board</strong>, nosotros tenemos una IA que
            completa la jugada. Vos dibujás a los tuyos; la IA mueve al rival y a tus compañeros.
            Menos tiempo dibujando, más tiempo pensando.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="grid grid-cols-3 border-b text-sm font-bold" style={{ borderColor: C.line }}>
            <div className="p-4" style={{ color: C.muted }}>
              Feature
            </div>
            <div className="p-4 text-center" style={{ color: C.accent }}>
              Pizarra Pro
            </div>
            <div className="p-4 text-center" style={{ color: C.muted }}>
              Otras pizarras
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.f}
              className="grid grid-cols-3 border-b last:border-b-0 text-sm"
              style={{ borderColor: C.line, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
            >
              <div className="p-4 font-medium" style={{ color: C.text }}>
                {r.f}
              </div>
              <div className="flex items-center justify-center p-4">
                {r.us === true ? (
                  <Check size={18} style={{ color: C.accent }} />
                ) : (
                  <span style={{ color: C.muted }}>{r.us}</span>
                )}
              </div>
              <div className="flex items-center justify-center p-4">
                {r.them === true ? (
                  <Check size={18} style={{ color: C.muted }} />
                ) : r.them === false ? (
                  <X size={16} style={{ color: C.red }} />
                ) : (
                  <span style={{ color: C.amber }}>{r.them}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────  PRICING  ──────────────────────────── */
function Pricing() {
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

/* ────────────────────  TESTIMONIAL  ───────────────────────── */
function Testimonial() {
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

/* ───────────────────  CTA FINAL + FOOTER  ─────────────────── */
function FinalCTA() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl p-8 text-center sm:p-14" style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` }}>
        <Zap size={32} className="mx-auto mb-3" style={{ color: C.bg }} />
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ color: C.bg }}>
          Tu próxima jugada empieza acá.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(14,20,22,0.8)' }}>
          Abrí la pizarra, dibujá, dejá que la IA complete. En 60 segundos tenés una jugada lista
          para mandar al plantel.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold transition-all hover:scale-[1.03] active:scale-95"
          style={{ background: C.bg, color: C.text, boxShadow: '0 8px 28px rgba(0,0,0,0.3)' }}
        >
          Probar gratis
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  const links = [
    { href: '#features', label: 'Producto' },
    { href: '#planes', label: 'Planes' },
    { href: '/', label: 'Ayuda' },
    { href: '/', label: 'Términos' },
    { href: '/', label: 'Privacidad' },
  ]
  return (
    <footer className="mt-auto border-t px-4 py-10 sm:px-6" style={{ borderColor: C.line, background: C.bg }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          {/* marca */}
          <div>
            <Link href="/landing" className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-black"
                style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: C.bg }}
              >
                ⚽
              </span>
              <span className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>
                Pizarra <span style={{ color: C.accent }}>Pro</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed" style={{ color: C.muted }}>
              La pizarra táctica con IA para entrenadores de fútbol 5, 8 y 11. Hecha en Argentina
              para Latinoamérica.
            </p>
          </div>

          {/* links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: C.muted }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div
          className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: C.line, color: C.muted }}
        >
          <span>© 2025 Pizarra Pro. Todos los derechos reservados.</span>
          <span className="inline-flex items-center gap-1.5">
            Hecho en Argentina
            <span className="text-base leading-none">🇦🇷</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ───────────────────────  PAGE  ───────────────────────────── */
export default function LandingPage() {
  return (
    <div
      className={`${inter.variable} flex min-h-screen flex-col`}
      style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif', background: C.bg, color: C.text }}
    >
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Differentiator />
        <Pricing />
        <Testimonial />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
