'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { C } from '../constantes'

export function Encabezado() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all"
      style={{
        background: scrolled ? 'rgba(14,20,22,0.85)' : 'rgba(14,20,22,0.6)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${scrolled ? C.line : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-black"
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              color: C.bg,
              boxShadow: `0 4px 12px ${C.accent}55`,
            }}
          >
            ⚽
          </span>
          <span className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>
            Pizarra <span style={{ color: C.accent }}>Pro</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="ml-6 hidden items-center gap-7 md:flex">
          <a href="#como-funciona" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Cómo funciona
          </a>
          <a href="#features" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Features
          </a>
          <a href="#planes" className="text-sm font-medium transition-colors hover:text-white" style={{ color: C.muted }}>
            Planes
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden text-sm font-semibold transition-colors hover:text-white sm:inline"
            style={{ color: C.muted }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
            style={{
              background: C.accent,
              color: C.bg,
              boxShadow: `0 4px 16px ${C.accent}40`,
            }}
          >
            Probar gratis
            <ArrowRight size={15} />
          </Link>
          {/* mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            style={{ borderColor: C.line, color: C.text, background: C.surface }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden"
            style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {[
                { href: '#como-funciona', label: 'Cómo funciona' },
                { href: '#features', label: 'Features' },
                { href: '#planes', label: 'Planes' },
              ].map((i) => (
                <a
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: C.text }}
                >
                  {i.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
