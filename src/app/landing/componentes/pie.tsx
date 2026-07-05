'use client'

import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { C } from '../constantes'

export function CtaFinal() {
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

export function Pie() {
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
