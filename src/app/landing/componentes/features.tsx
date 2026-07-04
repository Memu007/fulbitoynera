'use client'

import { motion } from 'framer-motion'
import { Brain, Trophy, Film, Repeat, MonitorDown, HardDrive } from 'lucide-react'
import { C } from '../constantes'

export function Features() {
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
