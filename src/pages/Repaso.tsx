import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Star, Play, Brain } from 'lucide-react'
import { disponibles, loadPreguntas } from '@/data/content'
import { temaById, temaLabel } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { QuizRunner, type QuizQuestion } from '@/components/QuizRunner'
import { Button, Empty, PageHeader, stagger } from '@/components/ui'
import { shuffle, shuffleOptions } from '@/lib/shuffle'
import { motion } from 'motion/react'

export default function Repaso() {
  const [pool, setPool] = useState<QuizQuestion[]>([])
  const [run, setRun] = useState<QuizQuestion[] | null>(null)
  const { qstats, favoritas } = useProgress()

  useEffect(() => {
    loadPreguntas(disponibles()).then(setPool)
  }, [])

  const falladas = useMemo(() => pool.filter((q) => qstats[q.id] && !qstats[q.id].ok), [pool, qstats])
  const favs = useMemo(() => pool.filter((q) => favoritas[q.id]), [pool, favoritas])
  const cronicas = useMemo(() => pool.filter((q) => (qstats[q.id]?.fallos ?? 0) >= 2).sort((a, b) => qstats[b.id].fallos - qstats[a.id].fallos), [pool, qstats])

  const porTema = useMemo(() => {
    const m: Record<string, number> = {}
    falladas.forEach((q) => (m[q.temaId] = (m[q.temaId] ?? 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [falladas])

  if (run)
    return (
      <QuizRunner
        key={run.map((q) => q.id).join()}
        title="Repaso"
        preguntas={run}
        mode="practica"
        recordTipo="repaso"
        onExit={() => setRun(null)}
        onRetry={(f) => setRun(shuffle(f).map(shuffleOptions))}
      />
    )

  const go = (list: QuizQuestion[], n = 40) => setRun(shuffle(list).slice(0, n).map(shuffleOptions))

  return (
    <div>
      <PageHeader eyebrow="Aprender de los errores" title="Repaso de fallos" subtitle="Aquí se acumulan las preguntas que fallaste la última vez que las viste. Cuando aciertes una, sale de la lista." />
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
        <RepasoCard icon={<RotateCcw size={22} />} color="#e11d48" title="Falladas" n={falladas.length} text="Tu última respuesta fue incorrecta" onStart={() => go(falladas)} />
        <RepasoCard icon={<Brain size={22} />} color="#7c3aed" title="Se te resisten" n={cronicas.length} text="Falladas dos o más veces" onStart={() => go(cronicas)} />
        <RepasoCard icon={<Star size={22} />} color="#d97706" title="Favoritas" n={favs.length} text="Las que has marcado con estrella" onStart={() => go(favs)} />
      </motion.div>

      {porTema.length > 0 ? (
        <div className="card mt-8 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Fallos por tema</h2>
          <div className="space-y-2">
            {porTema.map(([id, n]) => {
              const t = temaById(id)
              return (
                <button key={id} onClick={() => go(falladas.filter((q) => q.temaId === id))} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2">
                  <span className="w-20 text-sm font-semibold text-muted">{t ? temaLabel(t) : id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{t?.titulo}</span>
                  <span className="h-2 w-32 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full rounded-full bg-rose-500" style={{ width: `${(n / porTema[0][1]) * 100}%` }} />
                  </span>
                  <span className="w-8 text-right text-sm font-bold">{n}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <Empty icon={<RotateCcw size={26} />} title="Sin fallos pendientes">Haz tests y aquí irán apareciendo las preguntas que tengas que repasar.</Empty>
        </div>
      )}
    </div>
  )
}

function RepasoCard({ icon, color, title, n, text, onStart }: { icon: React.ReactNode; color: string; title: string; n: number; text: string; onStart: () => void }) {
  return (
    <motion.div variants={stagger.item} className="card flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>{icon}</span>
        <div>
          <div className="font-display text-3xl font-semibold">{n}</div>
          <div className="text-sm font-semibold">{title}</div>
        </div>
      </div>
      <p className="text-sm text-muted">{text}</p>
      <Button variant="secondary" disabled={!n} onClick={onStart} className="mt-auto">
        <Play size={15} /> Repasar {n > 40 ? '40' : ''}
      </Button>
    </motion.div>
  )
}
