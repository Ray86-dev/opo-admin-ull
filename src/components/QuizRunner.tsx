import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import {
  ChevronLeft, ChevronRight, Flag, Star, Clock, CheckCircle2, XCircle, CircleDashed, Send, RotateCcw,
  BookOpen, LayoutGrid, FileText, Trophy, AlertTriangle, Volume2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PreguntaId } from '@/data/content'
import { temaById, temaLabel } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { nota, fmtNota, notaColor, netas } from '@/lib/scoring'
import { fmtDuracion } from '@/lib/dates'
import { speaker } from '@/lib/tts'
import { cn } from '@/lib/cn'
import { AnimatedNumber, Button, Modal, ProgressRing, Tabs } from './ui'
import { Markdown } from './Markdown'

export interface QuizQuestion extends PreguntaId {
  /** clave de agrupación para la corrección por partes (supuesto, bloque, tema) */
  grupo?: string
  /** pregunta de reserva: no puntúa */
  reserva?: boolean
}

export interface Grupo {
  nombre: string
  /** texto del supuesto (markdown) que se muestra junto a la pregunta */
  contexto?: string
  /** nota mínima exigida para superar esta parte */
  minimo?: number
}

export interface QuizResult {
  aciertos: number
  fallos: number
  blancos: number
  total: number
  nota: number
  segundos: number
  porGrupo: { id: string; nombre: string; aciertos: number; fallos: number; blancos: number; total: number; nota: number; minimo?: number }[]
}

interface Props {
  title: string
  preguntas: QuizQuestion[]
  mode: 'practica' | 'examen'
  timeLimit?: number
  grupos?: Record<string, Grupo>
  recordTipo: 'test' | 'simulacro1' | 'simulacro2' | 'supuesto' | 'repaso'
  /** nota final calculada de otra forma (p. ej. media de supuestos) */
  finalScore?: (r: Omit<QuizResult, 'nota'>) => number
  onExit?: () => void
  onRetry?: (fallidas: QuizQuestion[]) => void
  headerExtra?: ReactNode
}

const LETTERS = ['a', 'b', 'c', 'd']

export function QuizRunner({ title, preguntas, mode, timeLimit, grupos, recordTipo, finalScore, onExit, onRetry, headerExtra }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [revealed, setRevealed] = useState<boolean[]>(() => preguntas.map(() => false))
  const [flags, setFlags] = useState<boolean[]>(() => preguntas.map(() => false))
  const [finished, setFinished] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [grid, setGrid] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showCtx, setShowCtx] = useState(true)
  const startRef = useRef(Date.now())
  const { answer, toggleFav, favoritas, addRecord } = useProgress()
  const [result, setResult] = useState<QuizResult | null>(null)

  const q = preguntas[idx]
  const grupo = q?.grupo && grupos ? grupos[q.grupo] : undefined
  const cardRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  // En pantallas estrechas el enunciado del supuesto va encima: al cambiar de pregunta, llevar la vista a la pregunta
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const el = cardRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 150
    if (window.innerWidth < 1024 || el.getBoundingClientRect().top < 120) window.scrollTo({ top, behavior: 'smooth' })
  }, [idx])

  // Cronómetro
  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [finished])

  const remaining = timeLimit ? Math.max(0, timeLimit - elapsed) : null

  const finish = useCallback(() => {
    if (finished) return
    speaker.stop()
    const segundos = Math.floor((Date.now() - startRef.current) / 1000)
    const scored = preguntas.map((p, i) => ({ p, a: answers[i] })).filter((x) => !x.p.reserva)
    let aciertos = 0, fallos = 0, blancos = 0
    scored.forEach(({ p, a }) => {
      if (a === null) blancos++
      else if (a === p.correcta) aciertos++
      else fallos++
    })
    // estadísticas por pregunta (incluye reserva: también es práctica)
    preguntas.forEach((p, i) => {
      const a = answers[i]
      if (a !== null && !(mode === 'practica' && revealed[i])) answer(p.id, a === p.correcta)
    })
    const ids = [...new Set(preguntas.filter((p) => !p.reserva).map((p) => p.grupo ?? '_'))]
    const porGrupo = ids.map((gid) => {
      const items = scored.filter((x) => (x.p.grupo ?? '_') === gid)
      const ac = items.filter((x) => x.a !== null && x.a === x.p.correcta).length
      const fa = items.filter((x) => x.a !== null && x.a !== x.p.correcta).length
      return {
        id: gid,
        nombre: grupos?.[gid]?.nombre ?? (temaById(gid) ? `${temaLabel(temaById(gid)!)} · ${temaById(gid)!.titulo}` : 'General'),
        aciertos: ac,
        fallos: fa,
        blancos: items.length - ac - fa,
        total: items.length,
        nota: nota(ac, fa, items.length),
        minimo: grupos?.[gid]?.minimo,
      }
    })
    const base = { aciertos, fallos, blancos, total: scored.length, segundos, porGrupo }
    const n = finalScore ? finalScore(base) : nota(aciertos, fallos, scored.length)
    const r = { ...base, nota: n }
    setResult(r)
    setFinished(true)
    addRecord({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      fecha: Date.now(),
      tipo: recordTipo,
      titulo: title,
      temas: [...new Set(preguntas.map((p) => p.temaId))],
      total: r.total,
      aciertos,
      fallos,
      blancos,
      nota: n,
      segundos,
      detalle: porGrupo.length > 1 ? porGrupo.map((g) => ({ nombre: g.nombre, nota: g.nota })) : undefined,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (n >= 5) {
      const end = Date.now() + (n >= 7 ? 1600 : 700)
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#2f4fd6', '#ef6a4c', '#f5b700', '#0f9488'] })
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#2f4fd6', '#ef6a4c', '#f5b700', '#0f9488'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [finished, preguntas, answers, mode, revealed, grupos, finalScore, addRecord, recordTipo, title, answer])

  // Fin por tiempo
  useEffect(() => {
    if (remaining === 0 && !finished) finish()
  }, [remaining, finished, finish])

  const choose = useCallback(
    (opt: number) => {
      if (finished) return
      if (mode === 'practica') {
        if (revealed[idx]) return
        setAnswers((a) => a.map((v, i) => (i === idx ? opt : v)))
        setRevealed((r) => r.map((v, i) => (i === idx ? true : v)))
        answer(q.id, opt === q.correcta)
      } else {
        setAnswers((a) => a.map((v, i) => (i === idx ? (v === opt ? null : opt) : v)))
      }
    },
    [finished, mode, revealed, idx, q, answer],
  )

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(preguntas.length - 1, i))), [preguntas.length])

  // Atajos de teclado
  useEffect(() => {
    if (finished) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      const n = ['1', '2', '3', '4'].indexOf(k) >= 0 ? +k - 1 : LETTERS.indexOf(k)
      if (n >= 0) choose(n)
      else if (k === 'arrowright' || k === 'enter') go(idx + 1)
      else if (k === 'arrowleft') go(idx - 1)
      else if (k === 'm') setFlags((f) => f.map((v, i) => (i === idx ? !v : v)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, choose, go, idx])

  const answeredCount = answers.filter((a) => a !== null).length
  const blanks = preguntas.length - answeredCount

  if (finished && result) {
    return <Results title={title} preguntas={preguntas} answers={answers} flags={flags} result={result} grupos={grupos} onExit={onExit} onRetry={onRetry} />
  }

  const isRevealed = mode === 'practica' && revealed[idx]
  const lowTime = remaining !== null && remaining < 300

  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabecera del test */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-line/60 bg-paper/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted">
              Pregunta {idx + 1} de {preguntas.length} · {answeredCount} respondidas
              {mode === 'examen' && ` · ${blanks} en blanco`}
            </div>
          </div>
          {headerExtra}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums transition-colors',
              lowTime ? 'animate-pulse border-rose-400 bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-line bg-surface',
            )}
          >
            <Clock size={15} />
            {remaining !== null ? fmtDuracion(remaining) : fmtDuracion(elapsed)}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setGrid(true)} aria-label="Ver todas las preguntas">
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Preguntas</span>
          </Button>
          <Button size="sm" onClick={() => setConfirm(true)}>
            <Send size={15} />
            <span className="hidden sm:inline">Entregar</span>
          </Button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div className="h-full bg-primary" animate={{ width: `${((idx + 1) / preguntas.length) * 100}%` }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }} />
        </div>
      </div>

      <div className={cn('grid gap-6', grupo?.contexto && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]')}>
        {grupo?.contexto && (
          <div className="lg:sticky lg:top-40 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto thin-scroll">
            <div className="card p-5">
              <button onClick={() => setShowCtx((s) => !s)} className="flex w-full cursor-pointer items-center gap-2 text-left">
                <FileText size={17} className="text-primary" />
                <span className="flex-1 font-display text-lg font-semibold">{grupo.nombre}</span>
                <span className="text-xs text-muted lg:hidden">{showCtx ? 'Ocultar' : 'Ver enunciado'}</span>
              </button>
              <div className={cn('mt-3', !showCtx && 'hidden lg:block')}>
                <Markdown source={grupo.contexto} className="prose-opo sans !text-[15px]" />
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div ref={cardRef} className="card p-5 md:p-7">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary">#{idx + 1}</span>
                {q.reserva && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-700 dark:text-amber-300">Reserva (no puntúa)</span>}
                {temaById(q.temaId) && <span>{temaLabel(temaById(q.temaId)!)}</span>}
                <span className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => speaker.load([{ text: q.enunciado }, ...q.opciones.map((o, i) => ({ text: `${LETTERS[i]}. ${o}` }))], { title: `Pregunta ${idx + 1}`, source: 'quiz' })}
                    className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2"
                    aria-label="Leer en voz alta"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    onClick={() => setFlags((f) => f.map((v, i) => (i === idx ? !v : v)))}
                    className={cn('grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2', flags[idx] && 'text-amber-500')}
                    aria-label="Marcar como dudosa"
                    title="Marcar como dudosa (M)"
                  >
                    <Flag size={16} fill={flags[idx] ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => toggleFav(q.id)}
                    className={cn('grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2', favoritas[q.id] && 'text-yellow-500')}
                    aria-label="Guardar en favoritas"
                  >
                    <Star size={16} fill={favoritas[q.id] ? 'currentColor' : 'none'} />
                  </button>
                </span>
              </div>

              <h2 className="text-[18px] font-semibold leading-snug md:text-[20px]">{q.enunciado}</h2>

              <div className="mt-6 flex flex-col gap-2.5">
                {q.opciones.map((op, i) => {
                  const selected = answers[idx] === i
                  const correct = isRevealed && i === q.correcta
                  const wrong = isRevealed && selected && i !== q.correcta
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.99 }}
                      animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      onClick={() => choose(i)}
                      className={cn(
                        'focus-ring group flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15.5px] leading-snug transition-all',
                        !isRevealed && !selected && 'border-line bg-surface hover:border-primary/40 hover:bg-primary-soft/40',
                        !isRevealed && selected && 'border-primary bg-primary-soft',
                        correct && 'border-emerald-500 bg-emerald-500/10',
                        wrong && 'border-rose-500 bg-rose-500/10',
                        isRevealed && !correct && !wrong && 'border-line opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold uppercase transition-colors',
                          selected && !isRevealed ? 'border-primary bg-primary text-white dark:text-[#0d1016]' : 'border-line text-muted',
                          correct && 'border-emerald-500 bg-emerald-500 text-white',
                          wrong && 'border-rose-500 bg-rose-500 text-white',
                        )}
                      >
                        {correct ? <CheckCircle2 size={16} /> : wrong ? <XCircle size={16} /> : LETTERS[i]}
                      </span>
                      <span className="pt-0.5">{op}</span>
                    </motion.button>
                  )
                })}
              </div>

              <AnimatePresence>
                {isRevealed && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className={cn('mt-5 rounded-2xl p-4 text-[15px] leading-relaxed', answers[idx] === q.correcta ? 'bg-emerald-500/10' : 'bg-rose-500/10')}>
                      <div className="mb-1 font-bold">{answers[idx] === q.correcta ? '¡Correcta!' : `Incorrecta · la buena es la ${LETTERS[q.correcta]})`}</div>
                      {q.explicacion}
                      {q.ref && <div className="mt-2 text-xs font-semibold text-muted">📖 {q.ref}</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => go(idx - 1)} disabled={idx === 0}>
                  <ChevronLeft size={18} /> Anterior
                </Button>
                {mode === 'examen' && answers[idx] !== null && (
                  <button onClick={() => setAnswers((a) => a.map((v, i) => (i === idx ? null : v)))} className="cursor-pointer text-sm text-muted underline-offset-2 hover:underline">
                    Dejar en blanco
                  </button>
                )}
                {idx < preguntas.length - 1 ? (
                  <Button variant={mode === 'practica' && !isRevealed ? 'secondary' : 'primary'} onClick={() => go(idx + 1)}>
                    Siguiente <ChevronRight size={18} />
                  </Button>
                ) : (
                  <Button onClick={() => setConfirm(true)}>
                    Terminar <Send size={16} />
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-3 hidden text-center text-xs text-muted md:block">Atajos: 1-4 o A-D para responder · ← → para moverte · M para marcar dudosa</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rejilla de preguntas */}
      <Modal open={grid} onClose={() => setGrid(false)} title="Todas las preguntas" wide>
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> Respondida</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-line bg-surface" /> En blanco</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-amber-400" /> Dudosa</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {preguntas.map((p, i) => (
            <button
              key={p.id + i}
              onClick={() => {
                go(i)
                setGrid(false)
              }}
              className={cn(
                'relative grid aspect-square cursor-pointer place-items-center rounded-lg text-xs font-bold transition hover:scale-105',
                answers[i] !== null ? 'bg-primary text-white dark:text-[#0d1016]' : 'border border-line bg-surface',
                flags[i] && 'ring-2 ring-amber-400',
                i === idx && 'outline-2 outline-offset-2 outline-ink',
                p.reserva && 'opacity-70',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="¿Entregar el ejercicio?">
        <div className="space-y-3 text-[15px]">
          <p>
            Has respondido <b>{answeredCount}</b> de {preguntas.length} preguntas.
            {blanks > 0 && <> Quedan <b>{blanks}</b> en blanco (no restan).</>}
          </p>
          {flags.some(Boolean) && (
            <p className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Flag size={15} /> Tienes {flags.filter(Boolean).length} marcadas como dudosas.
            </p>
          )}
          {remaining !== null && remaining > 0 && <p className="text-muted">Aún te quedan {fmtDuracion(remaining)}.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirm(false)}>Seguir</Button>
            <Button
              onClick={() => {
                setConfirm(false)
                finish()
              }}
            >
              Entregar y corregir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Results({
  title, preguntas, answers, flags, result, grupos, onExit, onRetry,
}: {
  title: string
  preguntas: QuizQuestion[]
  answers: (number | null)[]
  flags: boolean[]
  result: QuizResult
  grupos?: Record<string, Grupo>
  onExit?: () => void
  onRetry?: (f: QuizQuestion[]) => void
}) {
  const [filter, setFilter] = useState<'fallos' | 'blancos' | 'dudosas' | 'todas'>(result.fallos ? 'fallos' : 'todas')
  const { favoritas, toggleFav } = useProgress()
  const aprobado = result.nota >= 5 && result.porGrupo.every((g) => g.minimo === undefined || g.nota >= g.minimo)
  const items = useMemo(
    () =>
      preguntas
        .map((p, i) => ({ p, i, a: answers[i] }))
        .filter(({ p, a, i }) =>
          filter === 'todas' ? true : filter === 'fallos' ? a !== null && a !== p.correcta : filter === 'blancos' ? a === null : flags[i],
        ),
    [preguntas, answers, flags, filter],
  )
  const fallidas = preguntas.filter((p, i) => answers[i] !== p.correcta)
  const net = netas(result.aciertos, result.fallos)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6 md:p-10">
        <div className="absolute -right-20 -top-20 size-64 rounded-full opacity-20 blur-3xl" style={{ background: aprobado ? '#10b981' : '#f43f5e' }} />
        <div className="relative flex flex-col items-center gap-8 md:flex-row">
          <ProgressRing value={result.nota * 10} size={170} stroke={14} color={aprobado ? '#10b981' : result.nota >= 4 ? '#f59e0b' : '#f43f5e'}>
            <div className="text-center">
              <AnimatedNumber value={result.nota} decimals={2} className={cn('font-display text-5xl font-semibold', notaColor(result.nota))} />
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">sobre 10</div>
            </div>
          </ProgressRing>
          <div className="flex-1 text-center md:text-left">
            <div className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-muted md:justify-start">
              {aprobado ? <Trophy size={16} className="text-amber-500" /> : <AlertTriangle size={16} />}
              {title}
            </div>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              {aprobado ? (result.nota >= 7.5 ? '¡Brillante! Así se aprueba.' : '¡Aprobado! Sigue así.') : 'Todavía no. ¡A por la siguiente!'}
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Aciertos" value={result.aciertos} />
              <MiniStat icon={<XCircle size={16} className="text-rose-500" />} label="Fallos" value={result.fallos} />
              <MiniStat icon={<CircleDashed size={16} className="text-muted" />} label="En blanco" value={result.blancos} />
              <MiniStat icon={<Clock size={16} className="text-primary" />} label="Tiempo" value={fmtDuracion(result.segundos)} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Netas: {result.aciertos} − {result.fallos}/3 = <b className="text-ink">{fmtNota(net)}</b> sobre {result.total}. Cada 3 fallos restan un acierto.
            </p>
          </div>
        </div>
      </motion.div>

      {result.porGrupo.length > 1 && (
        <div className="card p-5 md:p-6">
          <h3 className="mb-4 font-display text-xl font-semibold">Desglose</h3>
          <div className="space-y-3">
            {result.porGrupo.map((g) => (
              <div key={g.id} className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{g.nombre}</div>
                  <div className="text-xs text-muted">
                    {g.aciertos} ✓ · {g.fallos} ✗ · {g.blancos} en blanco
                    {g.minimo !== undefined && (g.nota >= g.minimo ? ' · superado' : ` · no llega al mínimo de ${g.minimo}`)}
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: g.nota >= 5 ? '#10b981' : g.nota >= 4 ? '#f59e0b' : '#f43f5e' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.nota * 10}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
                <div className={cn('w-14 text-right font-display text-xl font-semibold', notaColor(g.nota))}>{fmtNota(g.nota)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onRetry && fallidas.length > 0 && (
          <Button onClick={() => onRetry(fallidas)}>
            <RotateCcw size={16} /> Repetir las {fallidas.length} falladas o en blanco
          </Button>
        )}
        {onExit && (
          <Button variant="secondary" onClick={onExit}>
            Volver
          </Button>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-semibold">Revisión</h3>
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'fallos', label: `Fallos (${result.fallos})` },
              { id: 'blancos', label: `En blanco (${preguntas.filter((_, i) => answers[i] === null).length})` },
              { id: 'dudosas', label: `Dudosas (${flags.filter(Boolean).length})` },
              { id: 'todas', label: 'Todas' },
            ]}
          />
        </div>
        <div className="space-y-4">
          {items.length === 0 && <p className="card p-6 text-center text-muted">Nada por aquí. 🎉</p>}
          {items.map(({ p, i, a }) => (
            <motion.div key={p.id + i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
                <span>#{i + 1}</span>
                {temaById(p.temaId) && (
                  <Link to={`/tema/${p.temaId}`} className="flex items-center gap-1 hover:text-primary">
                    <BookOpen size={12} /> {temaLabel(temaById(p.temaId)!)}
                  </Link>
                )}
                {p.grupo && grupos?.[p.grupo] && <span>· {grupos[p.grupo].nombre}</span>}
                {a === null ? <span className="ml-auto text-muted">En blanco</span> : a === p.correcta ? <span className="ml-auto text-emerald-600 dark:text-emerald-400">Acierto</span> : <span className="ml-auto text-rose-600 dark:text-rose-400">Fallo</span>}
                <button onClick={() => toggleFav(p.id)} className={cn('cursor-pointer', favoritas[p.id] ? 'text-yellow-500' : 'text-muted')} aria-label="Favorita">
                  <Star size={15} fill={favoritas[p.id] ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="font-semibold leading-snug">{p.enunciado}</p>
              <ul className="mt-3 space-y-1.5 text-[15px]">
                {p.opciones.map((o, k) => (
                  <li
                    key={k}
                    className={cn(
                      'flex gap-2 rounded-xl px-3 py-2',
                      k === p.correcta && 'bg-emerald-500/12 font-medium text-emerald-800 dark:text-emerald-300',
                      k === a && k !== p.correcta && 'bg-rose-500/12 text-rose-800 line-through decoration-rose-400/60 dark:text-rose-300',
                    )}
                  >
                    <b className="uppercase">{LETTERS[k]})</b> {o}
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
                {p.explicacion}
                {p.ref && <span className="mt-1 block text-xs font-semibold text-muted">📖 {p.ref}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
