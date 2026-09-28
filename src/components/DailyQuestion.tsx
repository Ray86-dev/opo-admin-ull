import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { disponibles, loadPreguntas, type PreguntaId } from '@/data/content'
import { temaById, temaLabel } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { todayKey } from '@/lib/dates'
import { cn } from '@/lib/cn'

/** Una pregunta distinta cada día, elegida de forma determinista por la fecha */
export function DailyQuestion() {
  const [pool, setPool] = useState<PreguntaId[] | null>(null)
  const [elegida, setElegida] = useState<number | null>(null)
  const answer = useProgress((s) => s.answer)

  useEffect(() => {
    loadPreguntas(disponibles()).then(setPool)
  }, [])

  const q = useMemo(() => {
    if (!pool?.length) return null
    const k = todayKey()
    let h = 0
    for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return pool[h % pool.length]
  }, [pool])

  const storageKey = `opo-ull-daily-${todayKey()}`
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey)
      if (v !== null) setElegida(Number(v))
    } catch {
      /* sin almacenamiento */
    }
  }, [storageKey])

  if (!q) return null
  const t = temaById(q.temaId)

  const choose = (i: number) => {
    if (elegida !== null) return
    setElegida(i)
    answer(q.id, i === q.correcta)
    try {
      localStorage.setItem(storageKey, String(i))
    } catch {
      /* sin almacenamiento */
    }
  }

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        <Sparkles size={15} /> Pregunta del día
        {t && (
          <Link to={`/tema/${t.id}`} className="ml-auto normal-case tracking-normal text-muted hover:text-ink">
            {temaLabel(t)}
          </Link>
        )}
      </div>
      <p className="font-semibold leading-snug">{q.enunciado}</p>
      <div className="mt-4 grid gap-2">
        {q.opciones.map((o, i) => {
          const done = elegida !== null
          const ok = done && i === q.correcta
          const bad = done && i === elegida && i !== q.correcta
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                !done && 'border-line hover:border-primary/40 hover:bg-primary-soft/40',
                ok && 'border-emerald-500 bg-emerald-500/10',
                bad && 'border-rose-500 bg-rose-500/10',
                done && !ok && !bad && 'border-line opacity-55',
              )}
            >
              <b className="uppercase text-muted">{'abcd'[i]})</b>
              <span className="flex-1">{o}</span>
              {ok && <CheckCircle2 size={16} className="text-emerald-500" />}
              {bad && <XCircle size={16} className="text-rose-500" />}
            </button>
          )
        })}
      </div>
      <AnimatePresence>
        {elegida !== null && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 overflow-hidden rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
            {q.explicacion} <span className="font-semibold text-muted">({q.ref})</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
