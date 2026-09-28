import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { AnimatePresence, motion } from 'motion/react'
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ProgressRing } from './ui'

type Fase = 'foco' | 'descanso'
const DUR: Record<Fase, number> = { foco: 25 * 60, descanso: 5 * 60 }

interface PomoState {
  fase: Fase
  restante: number
  corriendo: boolean
  ciclos: number
  focoMin: number
}

const usePomo = create<PomoState>(() => ({ fase: 'foco', restante: DUR.foco, corriendo: false, ciclos: 0, focoMin: 25 }))

function beep() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.25, 0.5].forEach((t, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = i === 2 ? 880 : 660
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.25)
    })
  } catch {
    /* sin audio */
  }
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function Pomodoro() {
  const { fase, restante, corriendo, ciclos, focoMin } = usePomo()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const total = fase === 'foco' ? focoMin * 60 : DUR.descanso

  useEffect(() => {
    if (!corriendo) return
    const end = Date.now() + restante * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000))
      if (left === 0) {
        beep()
        const st = usePomo.getState()
        const next: Fase = st.fase === 'foco' ? 'descanso' : 'foco'
        usePomo.setState({
          fase: next,
          restante: next === 'foco' ? st.focoMin * 60 : (st.ciclos + 1) % 4 === 0 && st.fase === 'foco' ? 15 * 60 : DUR.descanso,
          ciclos: st.fase === 'foco' ? st.ciclos + 1 : st.ciclos,
          corriendo: false,
        })
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification(next === 'descanso' ? '¡Bloque terminado! Toca descansar.' : 'Descanso terminado. ¡A por otro bloque!')
      } else usePomo.setState({ restante: left })
    }, 500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo])

  useEffect(() => {
    const base = 'Opo ULL · Escala Administrativa'
    document.title = corriendo ? `${mmss(restante)} ${fase === 'foco' ? '· Estudiando' : '· Descanso'}` : base
  }, [corriendo, restante, fase])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  const toggle = () => {
    if (!corriendo && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    usePomo.setState({ corriendo: !corriendo })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Temporizador Pomodoro"
        className={cn(
          'focus-ring flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold tabular-nums transition',
          corriendo ? (fase === 'foco' ? 'bg-primary text-white dark:text-[#0d1016]' : 'bg-emerald-500 text-white') : 'text-muted hover:bg-surface-2 hover:text-ink',
        )}
      >
        <Timer size={18} />
        {(corriendo || restante !== total) && <span>{mmss(restante)}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="card absolute right-0 top-12 z-50 w-72 p-5"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              {fase === 'foco' ? <Brain size={16} className="text-primary" /> : <Coffee size={16} className="text-emerald-500" />}
              {fase === 'foco' ? 'Bloque de estudio' : 'Descanso'}
              <span className="ml-auto text-xs text-muted">{ciclos} bloques hoy</span>
            </div>
            <div className="flex justify-center py-2">
              <ProgressRing value={(1 - restante / total) * 100} size={150} stroke={10} color={fase === 'foco' ? 'var(--primary)' : '#10b981'}>
                <span className="font-display text-4xl font-semibold tabular-nums">{mmss(restante)}</span>
              </ProgressRing>
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={toggle} className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white dark:text-[#0d1016]">
                {corriendo ? <Pause size={16} /> : <Play size={16} />} {corriendo ? 'Pausar' : 'Empezar'}
              </button>
              <button
                onClick={() => usePomo.setState({ corriendo: false, restante: fase === 'foco' ? focoMin * 60 : DUR.descanso })}
                className="grid size-10 cursor-pointer place-items-center rounded-full border border-line text-muted hover:text-ink"
                aria-label="Reiniciar"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs">
              {[25, 45, 50].map((m) => (
                <button
                  key={m}
                  onClick={() => usePomo.setState({ focoMin: m, fase: 'foco', restante: m * 60, corriendo: false })}
                  className={cn('cursor-pointer rounded-full px-3 py-1 font-semibold', focoMin === m ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2')}
                >
                  {m} min
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">Estudia sin distracciones y descansa 5 minutos. Cada 4 bloques, un descanso largo de 15.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
