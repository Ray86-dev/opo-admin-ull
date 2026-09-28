import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Check, BookOpen, RotateCcw, ClipboardList, Briefcase, Layers } from 'lucide-react'
import { TEMAS, temaLabel, bloqueById, type Tema } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { DAY, daysUntil } from '@/lib/dates'
import { PageHeader, ProgressBar } from '@/components/ui'
import { cn } from '@/lib/cn'

const PESO: Record<string, number> = { '1-04': 1.4, '1-05': 1.5, '1-06': 1.4, '1-08': 1.4, '1-09': 1.4, '1-02': 1.2, '2-02': 1.4, '4-04': 1.3, '4-01': 1.2, '3-02': 1.2 }

interface Tarea { id: string; texto: string; to?: string; icon: typeof BookOpen; color?: string }
interface Semana { n: number; inicio: Date; fin: Date; fase: 1 | 2 | 3; tareas: Tarea[] }

function construirPlan(inicio: Date, examen: Date): Semana[] {
  const totalDias = Math.max(14, Math.round((examen.getTime() - inicio.getTime()) / DAY))
  const semanas = Math.max(2, Math.floor(totalDias / 7))
  const s1 = Math.max(1, Math.round(semanas * 0.6))
  const s2 = Math.max(1, Math.round(semanas * 0.25))
  const s3 = Math.max(1, semanas - s1 - s2)
  const plan: Semana[] = []
  const mk = (n: number, fase: 1 | 2 | 3): Semana => {
    const ini = new Date(inicio.getTime() + n * 7 * DAY)
    return { n: n + 1, inicio: ini, fin: new Date(ini.getTime() + 6 * DAY), fase, tareas: [] }
  }

  // Fase 1: primera vuelta, reparto por pesos
  const pesoTotal = TEMAS.reduce((s, t) => s + (PESO[t.id] ?? 1), 0)
  const porSemana = pesoTotal / s1
  let acc = 0
  let w = 0
  const buckets: Tema[][] = Array.from({ length: s1 }, () => [])
  for (const t of TEMAS) {
    const p = PESO[t.id] ?? 1
    if (acc + p / 2 > porSemana * (w + 1) && w < s1 - 1) w++
    buckets[w].push(t)
    acc += p
  }
  buckets.forEach((ts, i) => {
    const s = mk(i, 1)
    ts.forEach((t) => {
      s.tareas.push({ id: `leer-${t.id}`, texto: `Estudiar ${temaLabel(t)}: ${t.titulo}`, to: `/tema/${t.id}`, icon: BookOpen, color: bloqueById(t.bloque).hex })
      s.tareas.push({ id: `test-${t.id}`, texto: `Test del ${temaLabel(t)} (objetivo ≥ 7)`, to: `/tema/${t.id}?tab=test`, icon: ClipboardList, color: bloqueById(t.bloque).hex })
    })
    s.tareas.push({ id: `flash-w${i}`, texto: 'Flashcards pendientes cada día (10–15 min)', to: '/flashcards', icon: Layers })
    if (i > 0) s.tareas.push({ id: `rep-w${i}`, texto: 'Repasar los resúmenes de la semana anterior', icon: RotateCcw })
    plan.push(s)
  })

  // Fase 2: segunda vuelta por bloques + supuestos
  const bloques = [1, 2, 3, 4]
  for (let i = 0; i < s2; i++) {
    const s = mk(s1 + i, 2)
    const mine = s2 >= 4 ? [bloques[i % 4]] : bloques.filter((_, k) => Math.floor((k * s2) / 4) === i)
    mine.forEach((b) => {
      const B = bloqueById(b)
      s.tareas.push({ id: `v2-b${b}-w${i}`, texto: `Segunda vuelta al Bloque ${B.romano} (resúmenes + esquemas)`, to: '/temario', icon: BookOpen, color: B.hex })
      s.tareas.push({ id: `sup-b${b}-w${i}`, texto: `Supuestos prácticos del Bloque ${B.romano}`, to: '/supuestos', icon: Briefcase, color: B.hex })
    })
    s.tareas.push({ id: `fallos-w${s1 + i}`, texto: 'Repaso de fallos y favoritas', to: '/repaso', icon: RotateCcw })
    s.tareas.push({ id: `plazos-w${s1 + i}`, texto: 'Tabla de plazos en modo «Ponte a prueba»', to: '/plazos', icon: CalendarDays })
    plan.push(s)
  }

  // Fase 3: simulacros
  for (let i = 0; i < s3; i++) {
    const s = mk(s1 + s2 + i, 3)
    s.tareas.push({ id: `sim1-w${i}`, texto: 'Simulacro del primer ejercicio (100 preguntas, 90 min)', to: '/simulacro', icon: ClipboardList })
    s.tareas.push({ id: `sim2-w${i}`, texto: 'Simulacro del segundo ejercicio (3 supuestos, 2 h)', to: '/simulacro', icon: Briefcase })
    s.tareas.push({ id: `deb-w${i}`, texto: 'Reforzar los 3 temas con peor porcentaje de aciertos', to: '/estadisticas', icon: RotateCcw })
    s.tareas.push({ id: `res-w${i}`, texto: 'Escuchar resúmenes de todo el temario', to: '/temario', icon: BookOpen })
    plan.push(s)
  }
  return plan
}

const FASE = {
  1: { nombre: 'Primera vuelta', color: '#2f4fd6', desc: 'Estudio a fondo de cada tema con su test' },
  2: { nombre: 'Segunda vuelta', color: '#0f9488', desc: 'Repaso por bloques y supuestos prácticos' },
  3: { nombre: 'Simulacros', color: '#ef6a4c', desc: 'Condiciones de examen y repaso final' },
}

export default function Plan() {
  const { settings, planHecho, togglePlan, setSettings } = useProgress()
  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // lunes de esta semana
    return d
  }, [])
  useEffect(() => {
    if (!settings.planInicio) setSettings({ planInicio: hoy.getTime() })
  }, [settings.planInicio, hoy, setSettings])
  const examen = settings.fechaExamen ? new Date(settings.fechaExamen + 'T09:00:00') : new Date(hoy.getTime() + 150 * DAY)
  const plan = useMemo(() => construirPlan(new Date(settings.planInicio ?? hoy.getTime()), examen), [settings.planInicio, hoy, examen.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = plan.reduce((s, w) => s + w.tareas.length, 0)
  const hechas = plan.reduce((s, w) => s + w.tareas.filter((t) => planHecho[t.id]).length, 0)
  const actual = plan.findIndex((w) => w.fin.getTime() + DAY > Date.now())
  const dias = daysUntil(settings.fechaExamen)

  return (
    <div>
      <PageHeader eyebrow="Organización" title="Plan de estudio" subtitle="Un plan semanal adaptado a los días que quedan. Marca las tareas según las completes; si te retrasas, no pasa nada: reajusta y sigue.">
        <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
          <span className="font-semibold">Examen:</span>
          <input type="date" value={settings.fechaExamen} onChange={(e) => setSettings({ fechaExamen: e.target.value })} className="bg-transparent outline-none" />
        </label>
        <button onClick={() => setSettings({ planInicio: hoy.getTime() })} className="h-9 cursor-pointer rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">
          Recalcular desde hoy
        </button>
      </PageHeader>

      {!settings.fechaExamen && <p className="mb-6 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">Todavía no has puesto la fecha del examen: el plan supone unas 21 semanas. En cuanto se publique la fecha, ponla arriba y el plan se reajusta.</p>}

      <div className="card mb-8 p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">{hechas} de {total} tareas completadas</div>
          <div className="text-sm text-muted">{dias !== null && dias > 0 ? `${dias} días para el examen · ` : ''}{plan.length} semanas</div>
        </div>
        <ProgressBar value={(hechas / Math.max(1, total)) * 100} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {([1, 2, 3] as const).map((f) => (
            <div key={f} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <span className="size-3 rounded-full" style={{ background: FASE[f].color }} />
              <div>
                <div className="text-sm font-semibold">{FASE[f].nombre} · {plan.filter((w) => w.fase === f).length} sem.</div>
                <div className="text-xs text-muted">{FASE[f].desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {plan.map((w, i) => {
          const done = w.tareas.filter((t) => planHecho[t.id]).length
          const isNow = i === actual
          return (
            <motion.div
              key={w.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              className={cn('card overflow-hidden', isNow && 'ring-2 ring-primary')}
            >
              <div className="flex items-center gap-4 border-b border-line p-4 md:px-6">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold text-white" style={{ background: FASE[w.fase].color }}>
                  {w.n}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    Semana {w.n}
                    {isNow && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white dark:text-[#0d1016]">Esta semana</span>}
                  </div>
                  <div className="text-sm text-muted">
                    {w.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – {w.fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · {FASE[w.fase].nombre}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-muted">{done}/{w.tareas.length}</div>
              </div>
              <ul className="divide-y divide-line">
                {w.tareas.map((t) => {
                  const ok = !!planHecho[t.id]
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 md:px-6">
                      <button
                        onClick={() => togglePlan(t.id)}
                        aria-label={ok ? 'Desmarcar' : 'Marcar como hecha'}
                        className={cn('grid size-6 shrink-0 cursor-pointer place-items-center rounded-lg border-2 transition', ok ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line hover:border-primary')}
                      >
                        {ok && <Check size={14} strokeWidth={3} />}
                      </button>
                      <t.icon size={16} className="shrink-0" style={{ color: t.color ?? 'var(--muted)' }} />
                      {t.to ? (
                        <Link to={t.to} className={cn('flex-1 text-[15px] hover:text-primary', ok && 'text-muted line-through')}>{t.texto}</Link>
                      ) : (
                        <span className={cn('flex-1 text-[15px]', ok && 'text-muted line-through')}>{t.texto}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
