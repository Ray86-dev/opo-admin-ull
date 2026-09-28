import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RotateCw, Sparkles, Volume2, Shuffle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useProgress } from '@/store/progress'
import { isDue, nextLabel, type Grade } from '@/lib/srs'
import { shuffle } from '@/lib/shuffle'
import { speaker } from '@/lib/tts'
import { temaById, temaLabel } from '@/data/temario'
import { cn } from '@/lib/cn'
import { Button } from './ui'

export interface DeckCard {
  id: string
  frente: string
  reverso: string
  ref: string
  temaId: string
}

const GRADES: { g: Grade; label: string; cls: string; key: string }[] = [
  { g: 0, label: 'Otra vez', cls: 'bg-rose-500/12 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300', key: '1' },
  { g: 1, label: 'Difícil', cls: 'bg-amber-500/12 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300', key: '2' },
  { g: 2, label: 'Bien', cls: 'bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300', key: '3' },
  { g: 3, label: 'Fácil', cls: 'bg-sky-500/12 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300', key: '4' },
]

export function FlashcardDeck({ cards, onlyDue = true }: { cards: DeckCard[]; onlyDue?: boolean }) {
  const srs = useProgress((s) => s.srs)
  const gradeCard = useProgress((s) => s.gradeCard)
  const [modo, setModo] = useState<'pendientes' | 'todas'>(onlyDue ? 'pendientes' : 'todas')
  const [queue, setQueue] = useState<DeckCard[]>([])
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)

  const dueCount = useMemo(() => cards.filter((c) => isDue(srs[c.id])).length, [cards, srs])

  const build = useCallback(
    (m: typeof modo) => {
      const st = useProgress.getState().srs
      const list = m === 'pendientes' ? cards.filter((c) => isDue(st[c.id])) : cards
      // primero las nunca vistas mezcladas con las vencidas, aleatorio
      setQueue(shuffle(list))
      setFlipped(false)
      setDone(0)
    },
    [cards],
  )

  useEffect(() => build(modo), [build, modo])

  const card = queue[0]

  const grade = useCallback(
    (g: Grade) => {
      if (!card) return
      gradeCard(card.id, g)
      setFlipped(false)
      setDone((d) => d + 1)
      setQueue((q) => {
        const rest = q.slice(1)
        // "Otra vez": vuelve a salir dentro de unas cartas
        if (g === 0) rest.splice(Math.min(rest.length, 3), 0, card)
        if (rest.length === 0) confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } })
        return rest
      })
    },
    [card, gradeCard],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped) {
        const gr = GRADES.find((x) => x.key === e.key)
        if (gr) grade(gr.g)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, grade])

  const total = done + queue.length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
          {(['pendientes', 'todas'] as const).map((m) => (
            <button key={m} onClick={() => setModo(m)} className={cn('cursor-pointer rounded-full px-4 py-1.5 transition', modo === m ? 'bg-primary text-white dark:text-[#0d1016]' : 'text-muted hover:text-ink')}>
              {m === 'pendientes' ? `Para hoy (${dueCount})` : `Todas (${cards.length})`}
            </button>
          ))}
        </div>
        <button onClick={() => build(modo)} className="ml-auto flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink">
          <Shuffle size={15} /> Barajar
        </button>
      </div>

      {total > 0 && (
        <div className="mb-4 flex items-center gap-3 text-sm text-muted">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full bg-primary" animate={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="tabular-nums">
            {done}/{total}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {card ? (
          <motion.div key={card.id + done} initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, x: -80, rotate: -6 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <div className="perspective">
              <motion.div
                className="preserve-3d relative min-h-[300px] cursor-pointer select-none md:min-h-[340px]"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                onClick={() => setFlipped((f) => !f)}
              >
                <Face>
                  <Meta card={card} label="Pregunta" />
                  <p className="font-display text-2xl font-medium leading-snug md:text-[27px]">{card.frente}</p>
                  <span className="mt-auto flex items-center gap-1.5 text-xs text-muted">
                    <RotateCw size={13} /> Toca o pulsa espacio para girar
                  </span>
                </Face>
                <Face back>
                  <Meta card={card} label="Respuesta" />
                  <p className="text-lg leading-relaxed md:text-xl">{card.reverso}</p>
                  {card.ref && <span className="mt-auto text-xs font-semibold text-muted">📖 {card.ref}</span>}
                </Face>
              </motion.div>
            </div>

            <div className="mt-5 min-h-[64px]">
              {flipped ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
                  {GRADES.map((x) => (
                    <button key={x.g} onClick={() => grade(x.g)} className={cn('flex cursor-pointer flex-col items-center rounded-2xl py-2.5 text-sm font-bold transition active:scale-95', x.cls)}>
                      {x.label}
                      <span className="text-[11px] font-medium opacity-70">{nextLabel(srs[card.id], x.g)}</span>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <div className="flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => speaker.load([{ text: card.frente }, { text: card.reverso }], { title: 'Flashcard', source: 'flash' })}>
                    <Volume2 size={16} /> Escuchar
                  </Button>
                  <Button onClick={() => setFlipped(true)}>Ver respuesta</Button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="grid size-16 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-600">
              <Sparkles size={30} />
            </div>
            <h3 className="font-display text-2xl font-semibold">{done > 0 ? '¡Sesión completada!' : 'No hay tarjetas pendientes'}</h3>
            <p className="max-w-sm text-muted">
              {done > 0 ? `Has repasado ${done} tarjetas. El sistema te las volverá a mostrar justo cuando estés a punto de olvidarlas.` : 'Vuelve más tarde o repasa todas las tarjetas si quieres practicar más.'}
            </p>
            {modo === 'pendientes' && (
              <Button variant="secondary" onClick={() => setModo('todas')}>
                Repasar todas
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-4 hidden text-center text-xs text-muted md:block">Espacio: girar · 1 Otra vez · 2 Difícil · 3 Bien · 4 Fácil</p>
    </div>
  )
}

function Face({ back, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn('card backface-hidden thin-scroll absolute inset-0 flex flex-col gap-4 overflow-y-auto p-7 md:p-9', back && 'bg-primary-soft')}
      style={back ? { transform: 'rotateY(180deg)' } : undefined}
    >
      {children}
    </div>
  )
}

function Meta({ card, label }: { card: DeckCard; label: string }) {
  const t = temaById(card.temaId)
  return (
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
      <span className="text-primary">{label}</span>
      {t && <span>{temaLabel(t)}</span>}
    </div>
  )
}
