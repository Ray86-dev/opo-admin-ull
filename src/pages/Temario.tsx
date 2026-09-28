import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Hourglass } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { hasTema } from '@/data/content'
import { useProgress, emptyTema, type EstadoTema } from '@/store/progress'
import { PageHeader, ProgressRing, stagger, Tabs } from '@/components/ui'
import { cn } from '@/lib/cn'

const ESTADO_COLOR: Record<EstadoTema, string> = { pendiente: '#94a3b8', estudiando: '#f59e0b', estudiado: '#3b82f6', dominado: '#10b981' }
const ESTADO_LABEL: Record<EstadoTema, string> = { pendiente: 'Pendiente', estudiando: 'Estudiando', estudiado: 'Estudiado', dominado: 'Dominado' }

export function temaAccuracy(temaId: string, qstats: Record<string, { aciertos: number; fallos: number }>) {
  let a = 0, f = 0
  for (const [k, v] of Object.entries(qstats)) {
    if (k.startsWith(temaId + '#')) {
      a += v.aciertos
      f += v.fallos
    }
  }
  return a + f ? { pct: Math.round((a / (a + f)) * 100), n: a + f } : null
}

export default function Temario() {
  const temas = useProgress((s) => s.temas)
  const qstats = useProgress((s) => s.qstats)
  const [filtro, setFiltro] = useState<'todos' | '1' | '2' | '3' | '4'>('todos')

  const resumen = useMemo(() => {
    const c: Record<EstadoTema, number> = { pendiente: 0, estudiando: 0, estudiado: 0, dominado: 0 }
    TEMAS.forEach((t) => c[(temas[t.id] ?? emptyTema()).estado]++)
    return c
  }, [temas])

  return (
    <div>
      <PageHeader eyebrow="Programa oficial · 29 temas" title="Temario" subtitle="Cada tema incluye el desarrollo completo para leer o escuchar, resumen, esquema interactivo, claves y plazos, flashcards, test y vídeos.">
        <div className="flex gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
          {(Object.keys(resumen) as EstadoTema[]).map((e) => (
            <div key={e} className="text-center">
              <div className="font-display text-xl font-semibold" style={{ color: ESTADO_COLOR[e] }}>{resumen[e]}</div>
              <div className="text-[11px] text-muted">{ESTADO_LABEL[e]}</div>
            </div>
          ))}
        </div>
      </PageHeader>

      <Tabs
        className="mb-8"
        value={filtro}
        onChange={setFiltro}
        tabs={[{ id: 'todos', label: 'Todos' }, ...BLOQUES.map((b) => ({ id: String(b.id) as '1', label: `${b.romano} · ${b.corto}` }))]}
      />

      <div className="space-y-12">
        {BLOQUES.filter((b) => filtro === 'todos' || String(b.id) === filtro).map((b) => {
          const list = TEMAS.filter((t) => t.bloque === b.id)
          const done = list.filter((t) => ['estudiado', 'dominado'].includes(temas[t.id]?.estado ?? '')).length
          return (
            <section key={b.id}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl font-display text-lg font-bold text-white" style={{ background: b.hex }}>{b.romano}</div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">{b.nombre}</h2>
                    <p className="text-sm text-muted">{list.length} temas · {done} estudiados</p>
                  </div>
                </div>
              </div>
              <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((t) => {
                  const p = temas[t.id] ?? emptyTema()
                  const acc = temaAccuracy(t.id, qstats)
                  const ready = hasTema(t.id)
                  return (
                    <motion.div key={t.id} variants={stagger.item}>
                      <Link to={`/tema/${t.id}`} className="card group relative flex h-full flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: b.hex }} />
                        <div className="flex items-start gap-4">
                          <ProgressRing value={p.leido} size={54} stroke={5} color={b.hex}>
                            <span className="font-display text-sm font-bold">{t.num}</span>
                          </ProgressRing>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold" style={{ color: b.hex }}>{temaLabel(t)}</div>
                            <h3 className="mt-0.5 font-semibold leading-snug">{t.titulo}</h3>
                          </div>
                          <ArrowUpRight size={18} className="shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
                        </div>
                        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{t.epigrafe}</p>
                        <div className="mt-auto flex items-center gap-2 pt-4 text-xs">
                          <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-semibold">
                            <span className="size-2 rounded-full" style={{ background: ESTADO_COLOR[p.estado] }} />
                            {ESTADO_LABEL[p.estado]}
                          </span>
                          {acc && (
                            <span className={cn('rounded-full px-2.5 py-1 font-semibold', acc.pct >= 70 ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : acc.pct >= 50 ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300' : 'bg-rose-500/12 text-rose-700 dark:text-rose-300')}>
                              {acc.pct} % aciertos
                            </span>
                          )}
                          {!ready && (
                            <span className="ml-auto flex items-center gap-1 text-muted">
                              <Hourglass size={12} /> En preparación
                            </span>
                          )}
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
