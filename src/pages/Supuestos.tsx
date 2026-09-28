import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Briefcase, Play, Clock, Hourglass, CheckCircle2 } from 'lucide-react'
import { loadSupuestos, type Supuesto } from '@/data/content'
import { BLOQUES, temaById, temaLabel } from '@/data/temario'
import { useAsync } from '@/lib/useAsync'
import { useProgress } from '@/store/progress'
import { QuizRunner, type QuizQuestion } from '@/components/QuizRunner'
import { Markdown } from '@/components/Markdown'
import { BloqueBadge, Button, Empty, LoadingArticle, PageHeader, stagger } from '@/components/ui'
import { shuffleOptions } from '@/lib/shuffle'
import { fmtNota, notaColor } from '@/lib/scoring'
import { cn } from '@/lib/cn'

export default function Supuestos() {
  const { id } = useParams()
  const { data, loading } = useAsync(loadSupuestos, [])
  if (loading) return <LoadingArticle />
  const list = data ?? []
  if (id) {
    const s = list.find((x) => x.id === id)
    return s ? <SupuestoDetail s={s} /> : <Empty title="Supuesto no encontrado" />
  }
  return <SupuestosList list={list} />
}

function SupuestosList({ list }: { list: Supuesto[] }) {
  const historial = useProgress((s) => s.historial)
  const best = (s: Supuesto) => {
    const h = historial.filter((x) => x.tipo === 'supuesto' && x.titulo.endsWith(s.titulo))
    return h.length ? Math.max(...h.map((x) => x.nota)) : null
  }
  return (
    <div>
      <PageHeader
        eyebrow="Segundo ejercicio"
        title="Supuestos prácticos"
        subtitle="Casos reales ambientados en la Universidad de La Laguna con 15 preguntas cada uno, como en el segundo ejercicio. Tienes que aplicar la norma: calcular plazos, identificar el órgano competente, el recurso procedente, el documento contable…"
      />
      {list.length === 0 && <Empty icon={<Hourglass size={26} />} title="Supuestos en preparación">Se están redactando a partir de la normativa. Aparecerán aquí en cuanto estén listos.</Empty>}
      <div className="space-y-10">
        {BLOQUES.map((b) => {
          const items = list.filter((s) => s.bloque === b.id)
          if (!items.length) return null
          return (
            <section key={b.id}>
              <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-semibold">
                <span className="grid size-9 place-items-center rounded-xl text-base text-white" style={{ background: b.hex }}>{b.romano}</span>
                {b.nombre}
              </h2>
              <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                {items.map((s, i) => {
                  const nb = best(s)
                  return (
                    <motion.div key={s.id} variants={stagger.item}>
                      <Link to={`/supuestos/${s.id}`} className="card group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted">Supuesto {b.romano}.{i + 1}</span>
                          {nb !== null && <span className={cn('flex items-center gap-1 text-sm font-bold', notaColor(nb))}><CheckCircle2 size={14} /> {fmtNota(nb)}</span>}
                        </div>
                        <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{s.titulo}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{s.enunciado.replace(/[#*>_]/g, '').slice(0, 260)}</p>
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                          {s.temas?.map((t) => temaById(t) && <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{temaLabel(temaById(t)!)}</span>)}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function SupuestoDetail({ s }: { s: Supuesto }) {
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<'practica' | 'examen'>('examen')
  const [crono, setCrono] = useState(true)
  const [qs, setQs] = useState<QuizQuestion[] | null>(null)
  const nav = useNavigate()
  const b = BLOQUES.find((x) => x.id === s.bloque)!
  const base = useMemo<QuizQuestion[]>(() => s.preguntas.map((p, i) => ({ ...p, id: `sup-${s.id}#${i}`, temaId: s.temas?.[0] ?? '', grupo: s.id })), [s])

  useEffect(() => {
    if (!qs && params.has('run')) setParams({}, { replace: true })
  }, [qs, params, setParams])

  if (qs)
    return (
      <QuizRunner
        key={qs.map((q) => q.id).join()}
        title={`Supuesto · ${s.titulo}`}
        preguntas={qs}
        grupos={{ [s.id]: { nombre: s.titulo, contexto: s.enunciado } }}
        mode={mode}
        timeLimit={crono ? 40 * 60 : undefined}
        recordTipo="supuesto"
        onExit={() => {
          setQs(null)
          setParams({})
        }}
        onRetry={(f) => setQs(f.map(shuffleOptions))}
      />
    )

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => nav('/supuestos')} className="mb-4 cursor-pointer text-sm text-muted hover:text-ink">← Todos los supuestos</button>
      <div className="card overflow-hidden">
        <div className="h-2" style={{ background: b.hex }} />
        <div className="p-6 md:p-9">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <BloqueBadge bloque={s.bloque} />
            <span className="flex items-center gap-1 text-xs text-muted"><Briefcase size={13} /> {s.preguntas.length} preguntas</span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{s.titulo}</h1>
          <div className="mt-6">
            <Markdown source={s.enunciado} className="prose-opo serif" />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <div className="flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
              {(['examen', 'practica'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn('cursor-pointer rounded-full px-4 py-1.5 transition', mode === m ? 'bg-primary text-white dark:text-[#0d1016]' : 'text-muted')}>
                  {m === 'examen' ? 'Modo examen' : 'Modo práctica'}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={crono} onChange={(e) => setCrono(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              <Clock size={15} /> 40 min (ritmo real)
            </label>
            <Button
              className="ml-auto"
              onClick={() => {
                setQs(base.map(shuffleOptions))
                setParams({ run: '1' })
              }}
            >
              <Play size={16} /> Resolver
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
