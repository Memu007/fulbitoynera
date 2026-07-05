'use client'

import { Check, X } from 'lucide-react'
import { C } from '../constantes'

export function Diferenciador() {
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
