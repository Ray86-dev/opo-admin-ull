import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Zap, Timer, Check, History, Filter } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { loadPreguntas, disponibles } from '@/data/content'
import { useProgress } from '@/store/progress'
import { QuizRunner, type QuizQuestion } from '@/components/QuizRunner'
import { Button, PageHeader, Empty } from '@/components/ui'
import { sampleProportional, shuffle, shuffleOptions } from '@/lib/shuffle'
import { fmtFecha } from '@/lib/dates'
import { fmtNota, notaColor } from '@/lib/scoring'
import { cn } from '@/lib/cn'

type Origen = 'todas' | 'nuevas' | 'falladas' | 'favoritas'

export default function Tests() {
  const avail = useMemo(() => disponibles(), [])
  const [sel, setSel] = useState<Set<string>>(() => new Set(avail))
  const [n, setN] = useState(30)
  const [mode, setMode] = useState<'practica' | 'examen'>('examen')
  const [crono, setCrono] = useState(true)
  const [origen, setOrigen] = useState<Origen>('todas')
  const [dif, setDif] = useState<Set<number>>(new Set([1, 2, 3]))
  const [run, setRun] = useState<{ qs: QuizQuestion[]; title: string; limit?: number; mode: 'practica' | 'examen' } | null>(null)
  const [pool, setPool] = useState<QuizQuestion[]>([])
  const { qstats, favoritas, historial } = useProgress()

  useEffect(() => {
    loadPreguntas(avail).then((qs) => setPool(qs.map((q) => ({ ...q, grupo: q.temaId }))))
  }, [avail])

  const filtered = useMemo(
    () =>
      pool.filter(
        (q) =>
          sel.has(q.temaId) &&
          dif.has(q.dificultad ?? 2) &&
          (origen === 'todas' ||
            (origen === 'nuevas' && !qstats[q.id]) ||
            (origen === 'falladas' && qstats[q.id] && !qstats[q.id].ok) ||
            (origen === 'favoritas' && favoritas[q.id])),
      ),
    [pool, sel, dif, origen, qstats, favoritas],
  )

  const toggle = (id: string) => setSel((s) => {
    const x = new Set(s)
    if (x.has(id)) x.delete(id)
    else x.add(id)
    return x
  })
  const toggleBloque = (b: number) => {
    const ids = TEMAS.filter((t) => t.bloque === b && avail.includes(t.id)).map((t) => t.id)
    const all = ids.every((i) => sel.has(i))
    setSel((s) => {
      const x = new Set(s)
      ids.forEach((i) => (all ? x.delete(i) : x.add(i)))
      return x
    })
  }

  const start = (qs: QuizQuestion[], title: string, m = mode, limitPerQ = crono ? 54 : 0) => {
    if (!qs.length) return
    setRun({ qs: qs.map(shuffleOptions), title, mode: m, limit: limitPerQ ? qs.length * limitPerQ : undefined })
  }

  const build = (list: QuizQuestion[], k: number) => {
    const byTema = Object.values(list.reduce<Record<string, QuizQuestion[]>>((acc, q) => ((acc[q.temaId] ??= []).push(q), acc), {}))
    return sampleProportional(byTema, k)
  }

  if (run)
    return (
      <QuizRunner
        key={run.qs.map((q) => q.id).join()}
        title={run.title}
        preguntas={run.qs}
        mode={run.mode}
        timeLimit={run.limit}
        recordTipo="test"
        onExit={() => setRun(null)}
        onRetry={(f) => setRun({ ...run, qs: shuffle(f).map(shuffleOptions), limit: undefined, title: 'Repetición de fallos' })}
      />
    )

  const tests = historial.filter((h) => h.tipo === 'test' || h.tipo === 'repaso').slice(0, 8)

  return (
    <div>
      <PageHeader eyebrow="Practicar" title="Tests" subtitle="Crea tests a medida. Con el cronómetro activado tienes 54 segundos por pregunta, el mismo ritmo que en el examen real (100 preguntas en 90 minutos).">
        <Button variant="soft" onClick={() => start(build(pool, 10), 'Test rápido · 10 preguntas', 'practica', 0)} disabled={!pool.length}>
          <Zap size={16} /> Test rápido
        </Button>
      </PageHeader>

      {!avail.length ? (
        <Empty title="Aún no hay preguntas">El banco de preguntas se está generando.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="card min-w-0 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Temas</h2>
              <div className="flex gap-2 text-sm">
                <button className="cursor-pointer font-semibold text-primary" onClick={() => setSel(new Set(avail))}>Todos</button>
                <span className="text-line">|</span>
                <button className="cursor-pointer text-muted hover:text-ink" onClick={() => setSel(new Set())}>Ninguno</button>
              </div>
            </div>
            <div className="space-y-5">
              {BLOQUES.map((b) => {
                const list = TEMAS.filter((t) => t.bloque === b.id)
                return (
                  <div key={b.id}>
                    <button onClick={() => toggleBloque(b.id)} className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-bold" style={{ color: b.hex }}>
                      Bloque {b.romano} · {b.nombre}
                    </button>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {list.map((t) => {
                        const ok = avail.includes(t.id)
                        const on = sel.has(t.id)
                        const cnt = pool.filter((q) => q.temaId === t.id).length
                        return (
                          <button
                            key={t.id}
                            disabled={!ok}
                            onClick={() => toggle(t.id)}
                            className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40', on ? 'border-transparent bg-primary-soft' : 'border-line hover:bg-surface-2')}
                          >
                            <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border transition', on ? 'border-primary bg-primary text-white dark:text-[#0d1016]' : 'border-line')}>
                              {on && <Check size={13} strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              <b className="font-semibold">{temaLabel(t).replace('Tema ', '')}</b> {t.titulo}
                            </span>
                            <span className="text-xs text-muted">{ok ? cnt : '—'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card space-y-5 p-5 md:p-6">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Filter size={15} /> Preguntas</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['todas', 'nuevas', 'falladas', 'favoritas'] as Origen[]).map((o) => (
                    <button key={o} onClick={() => setOrigen(o)} className={cn('cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold capitalize transition', origen === o ? 'bg-primary text-white dark:text-[#0d1016]' : 'bg-surface-2 text-muted hover:text-ink')}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold">Dificultad</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDif((s) => { const x = new Set(s); if (x.has(d) && x.size > 1) x.delete(d); else x.add(d); return x })}
                      className={cn('cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition', dif.has(d) ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted')}
                    >
                      {['Fácil', 'Media', 'Difícil'][d - 1]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span>Número de preguntas</span>
                  <span className="text-primary">{Math.min(n, filtered.length)}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 20, 30, 50, 100].map((k) => (
                    <button key={k} onClick={() => setN(k)} className={cn('cursor-pointer rounded-xl py-2 text-sm font-semibold transition', n === k ? 'bg-primary text-white dark:text-[#0d1016]' : 'bg-surface-2 text-muted hover:text-ink')}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['examen', 'practica'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn('cursor-pointer rounded-xl border-2 p-3 text-left transition', mode === m ? 'border-primary bg-primary-soft' : 'border-line')}>
                    <div className="text-sm font-bold">{m === 'examen' ? 'Modo examen' : 'Modo práctica'}</div>
                    <div className="text-xs text-muted">{m === 'examen' ? 'Corrección al final' : 'Explicación al momento'}</div>
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold">
                <span className="flex items-center gap-2"><Timer size={16} /> Cronómetro real (54 s/preg.)</span>
                <input type="checkbox" checked={crono} onChange={(e) => setCrono(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              </label>
              <Button size="lg" className="w-full" disabled={!filtered.length} onClick={() => start(build(filtered, n), `Test · ${Math.min(n, filtered.length)} preguntas`)}>
                <Play size={17} /> Empezar test
              </Button>
              <p className="text-center text-xs text-muted">{filtered.length} preguntas disponibles con estos filtros</p>
            </div>

            {tests.length > 0 && (
              <div className="card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><History size={15} /> Últimos tests</div>
                <div className="space-y-2">
                  {tests.map((h) => (
                    <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm">
                      <span className={cn('w-12 font-display text-lg font-semibold', notaColor(h.nota))}>{fmtNota(h.nota)}</span>
                      <span className="min-w-0 flex-1 truncate text-muted">{h.titulo}</span>
                      <span className="text-xs text-muted">{fmtFecha(h.fecha)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
