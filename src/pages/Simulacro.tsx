import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ClipboardList, Briefcase, Clock, AlertTriangle, CheckCircle2, Play, Info, TrendingUp } from 'lucide-react'
import { disponibles, loadPreguntas, loadSupuestos, type Supuesto } from '@/data/content'
import { TEMAS } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { QuizRunner, type Grupo, type QuizQuestion } from '@/components/QuizRunner'
import { Button, Modal, PageHeader, BloqueBadge } from '@/components/ui'
import { sampleProportional, shuffle, shuffleOptions } from '@/lib/shuffle'
import { fmtFecha, fmtDuracion } from '@/lib/dates'
import { fmtNota, notaColor } from '@/lib/scoring'
import { cn } from '@/lib/cn'
import { Sparkline } from '@/components/Charts'

type Run =
  | { tipo: 1; qs: QuizQuestion[] }
  | { tipo: 2; qs: QuizQuestion[]; grupos: Record<string, Grupo> }

export default function Simulacro() {
  const [params, setParams] = useSearchParams()
  const [run, setRun] = useState<Run | null>(null)
  const [elegir, setElegir] = useState<Supuesto[] | null>(null)
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())
  const [pool, setPool] = useState<QuizQuestion[]>([])
  const [supuestos, setSupuestos] = useState<Supuesto[]>([])
  const historial = useProgress((s) => s.historial)

  useEffect(() => {
    loadPreguntas(disponibles()).then(setPool)
    loadSupuestos().then(setSupuestos)
  }, [])

  // Si se recarga con ?run pero sin estado, limpiar
  useEffect(() => {
    if (!run && params.has('run')) setParams({}, { replace: true })
  }, [run, params, setParams])

  const startE1 = () => {
    const byTema = TEMAS.map((t) => pool.filter((q) => q.temaId === t.id)).filter((g) => g.length)
    const qs = sampleProportional(byTema, 110).map(shuffleOptions)
    const withReserve = qs.map((q, i) => ({ ...q, grupo: `b${bloqueFromTema(q.temaId)}`, reserva: i >= 100 && qs.length > 100 }))
    setRun({ tipo: 1, qs: withReserve })
    setParams({ run: '1' })
  }

  const prepareE2 = () => {
    const porBloque = [1, 2, 3, 4].map((b) => shuffle(supuestos.filter((s) => s.bloque === b))[0]).filter(Boolean) as Supuesto[]
    setElegir(porBloque)
    setElegidos(new Set(porBloque.slice(0, 3).map((s) => s.id)))
  }

  const startE2 = () => {
    if (!elegir) return
    const chosen = elegir.filter((s) => elegidos.has(s.id))
    const grupos: Record<string, Grupo> = {}
    const qs: QuizQuestion[] = []
    chosen.forEach((s, k) => {
      grupos[s.id] = { nombre: `Supuesto ${k + 1} · ${s.titulo}`, contexto: s.enunciado, minimo: 5 }
      s.preguntas.forEach((p, i) => qs.push(shuffleOptions({ ...p, id: `sup-${s.id}#${i}`, temaId: s.temas?.[0] ?? '', grupo: s.id })))
    })
    setElegir(null)
    setRun({ tipo: 2, qs, grupos })
    setParams({ run: '2' })
  }

  const exit = () => {
    setRun(null)
    setParams({})
  }

  if (run?.tipo === 1)
    return (
      <QuizRunner
        title="Simulacro · Primer ejercicio"
        preguntas={run.qs}
        mode="examen"
        timeLimit={90 * 60}
        recordTipo="simulacro1"
        grupos={{ b1: { nombre: 'Bloque I · Derecho Administrativo' }, b2: { nombre: 'Bloque II · Recursos Humanos' }, b3: { nombre: 'Bloque III · Gestión Financiera' }, b4: { nombre: 'Bloque IV · Gestión Universitaria' } }}
        onExit={exit}
      />
    )

  if (run?.tipo === 2)
    return (
      <QuizRunner
        title="Simulacro · Segundo ejercicio (supuestos prácticos)"
        preguntas={run.qs}
        grupos={run.grupos}
        mode="examen"
        timeLimit={120 * 60}
        recordTipo="simulacro2"
        finalScore={(r) => (r.porGrupo.length ? r.porGrupo.reduce((s, g) => s + g.nota, 0) / r.porGrupo.length : 0)}
        onExit={exit}
      />
    )

  const sims1 = historial.filter((h) => h.tipo === 'simulacro1')
  const sims2 = historial.filter((h) => h.tipo === 'simulacro2')
  const bloquesSup = new Set(supuestos.map((s) => s.bloque))

  return (
    <div>
      <PageHeader
        eyebrow="Practicar en condiciones reales"
        title="Simulacro de examen"
        subtitle="Mismo formato, mismo tiempo y misma corrección que la fase de oposición. Busca un sitio tranquilo, silencia el móvil y hazlo de una sentada."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SimCard
          icon={<ClipboardList size={24} />}
          color="#2f4fd6"
          titulo="Primer ejercicio"
          sub="Cuestionario tipo test"
          items={[
            '100 preguntas + 10 de reserva (las de reserva no puntúan salvo anulación)',
            '4 opciones, solo una correcta',
            '90 minutos',
            'Cada 3 errores restan 1 acierto; en blanco no puntúa',
            'Se aprueba con 5 sobre 10',
          ]}
          aviso={pool.length < 110 ? `Ahora mismo hay ${pool.length} preguntas en el banco; el simulacro usará las disponibles.` : undefined}
          disabled={!pool.length}
          onStart={startE1}
          historial={sims1}
        />
        <SimCard
          icon={<Briefcase size={24} />}
          color="#0f9488"
          titulo="Segundo ejercicio"
          sub="Supuestos prácticos"
          items={[
            'Se proponen 4 supuestos (uno por bloque) y resuelves 3',
            '15 preguntas tipo test por supuesto',
            '2 horas en total',
            'Misma penalización: cada 3 errores restan 1 acierto',
            'Mínimo un 5 en cada supuesto; la nota es la media',
          ]}
          aviso={bloquesSup.size < 3 ? 'Todavía no hay supuestos suficientes (hacen falta de al menos 3 bloques).' : bloquesSup.size < 4 ? 'Aún faltan supuestos de algún bloque: se propondrán los disponibles.' : undefined}
          disabled={bloquesSup.size < 3}
          onStart={prepareE2}
          historial={sims2}
        />
      </div>

      <div className="card mt-6 flex gap-4 p-5 text-[15px] leading-relaxed">
        <Info size={20} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <b>Cómo se calcula la nota final de la oposición.</b> La fase de oposición es la media de los dos ejercicios y pesa el 80 %; el concurso de méritos, el 20 % restante. Cada ejercicio es eliminatorio: necesitas al menos un 5 en cada uno. Tienes una calculadora en <a className="font-semibold text-primary underline" href="#/examen">Cómo es el examen</a>.
        </div>
      </div>

      <Modal open={!!elegir} onClose={() => setElegir(null)} title="Elige 3 de los 4 supuestos" wide>
        <p className="mb-4 text-sm text-muted">Como en el examen: lee los enunciados por encima y quédate con los tres que mejor domines.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {elegir?.map((s) => {
            const on = elegidos.has(s.id)
            return (
              <button
                key={s.id}
                onClick={() =>
                  setElegidos((prev) => {
                    const x = new Set(prev)
                    if (x.has(s.id)) x.delete(s.id)
                    else if (x.size < 3) x.add(s.id)
                    return x
                  })
                }
                className={cn('cursor-pointer rounded-2xl border-2 p-4 text-left transition', on ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/40')}
              >
                <div className="mb-2 flex items-center justify-between">
                  <BloqueBadge bloque={s.bloque} />
                  {on && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <div className="font-semibold">{s.titulo}</div>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{s.enunciado.replace(/[#*>]/g, '').slice(0, 220)}…</p>
              </button>
            )
          })}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">{elegidos.size} de 3 elegidos</span>
          <Button disabled={elegidos.size !== Math.min(3, elegir?.length ?? 0)} onClick={startE2}>
            <Play size={16} /> Empezar (2 horas)
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function bloqueFromTema(id: string) {
  return Number(id.split('-')[0])
}

function SimCard({
  icon, color, titulo, sub, items, aviso, disabled, onStart, historial,
}: {
  icon: React.ReactNode
  color: string
  titulo: string
  sub: string
  items: string[]
  aviso?: string
  disabled?: boolean
  onStart: () => void
  historial: { id: string; nota: number; fecha: number; segundos: number }[]
}) {
  const best = useMemo(() => (historial.length ? Math.max(...historial.map((h) => h.nota)) : null), [historial])
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card relative flex flex-col overflow-hidden p-6 md:p-8">
      <div className="absolute -right-12 -top-12 size-44 rounded-full opacity-15 blur-2xl" style={{ background: color }} />
      <div className="relative flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: color }}>{icon}</div>
        <div>
          <div className="text-sm font-semibold text-muted">{sub}</div>
          <h2 className="font-display text-2xl font-semibold">{titulo}</h2>
        </div>
      </div>
      <ul className="relative mt-6 space-y-2.5 text-[15px]">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" style={{ color }} />
            {it}
          </li>
        ))}
      </ul>
      {aviso && (
        <p className="relative mt-4 flex gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {aviso}
        </p>
      )}
      {historial.length > 0 && (
        <div className="relative mt-6 rounded-2xl bg-surface-2 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold"><TrendingUp size={15} /> Tu evolución</span>
            <span className="text-muted">Mejor nota: <b className={notaColor(best ?? 0)}>{fmtNota(best ?? 0)}</b></span>
          </div>
          <Sparkline values={[...historial].reverse().map((h) => h.nota)} max={10} color={color} />
          <div className="mt-2 space-y-1">
            {historial.slice(0, 3).map((h) => (
              <div key={h.id} className="flex justify-between text-xs text-muted">
                <span>{fmtFecha(h.fecha)} · {fmtDuracion(h.segundos)}</span>
                <b className={notaColor(h.nota)}>{fmtNota(h.nota)}</b>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="relative mt-auto pt-6">
        <Button size="lg" className="w-full" disabled={disabled} onClick={onStart} style={{ background: color }}>
          <Clock size={17} /> Empezar simulacro
        </Button>
      </div>
    </motion.div>
  )
}

