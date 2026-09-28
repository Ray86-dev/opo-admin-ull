import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Target, Clock, ListChecks, Trophy } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { useProgress } from '@/store/progress'
import { PageHeader, Stat, AnimatedNumber } from '@/components/ui'
import { ScoreChart, StudyHeatmap } from '@/components/Charts'
import { fmtFecha, fmtDuracion } from '@/lib/dates'
import { fmtNota, notaColor } from '@/lib/scoring'
import { temaAccuracy } from './Temario'
import { cn } from '@/lib/cn'

const TIPO: Record<string, string> = { test: 'Test', simulacro1: 'Simulacro 1.º', simulacro2: 'Simulacro 2.º', supuesto: 'Supuesto', repaso: 'Repaso' }

export default function Estadisticas() {
  const { historial, qstats, diario } = useProgress()
  const resp = Object.values(qstats)
  const total = resp.reduce((s, q) => s + q.aciertos + q.fallos, 0)
  const ac = resp.reduce((s, q) => s + q.aciertos, 0)
  const horas = Object.values(diario).reduce((a, b) => a + b, 0) / 60
  const puntos = useMemo(() => [...historial].reverse().slice(-40).map((h) => ({ x: `${TIPO[h.tipo]} ${fmtFecha(h.fecha)}`, y: h.nota })), [historial])
  const media = historial.length ? historial.reduce((s, h) => s + h.nota, 0) / historial.length : 0

  return (
    <div>
      <PageHeader eyebrow="Tu evolución" title="Estadísticas" subtitle="Datos para decidir qué estudiar: dónde fallas más, cómo evolucionan tus notas y cuánto tiempo dedicas." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Preguntas respondidas" value={<AnimatedNumber value={total} />} icon={<ListChecks size={18} />} hint={`${Object.keys(qstats).length} distintas`} />
        <Stat label="Aciertos" value={<AnimatedNumber value={total ? (ac / total) * 100 : 0} suffix=" %" />} icon={<Target size={18} />} hint="Porcentaje global" />
        <Stat label="Nota media" value={<span className={notaColor(media)}>{fmtNota(media)}</span>} icon={<Trophy size={18} />} hint={`${historial.length} tests y simulacros`} />
        <Stat label="Horas de estudio" value={<AnimatedNumber value={horas} decimals={1} />} icon={<Clock size={18} />} hint="Tiempo activo en la web" />
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Evolución de notas</h2>
        <ScoreChart points={puntos} />
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-5 font-display text-xl font-semibold">Aciertos por tema</h2>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {BLOQUES.map((b) => (
            <div key={b.id}>
              <div className="mb-2 text-sm font-bold" style={{ color: b.hex }}>Bloque {b.romano} · {b.nombre}</div>
              <div className="space-y-1.5">
                {TEMAS.filter((t) => t.bloque === b.id).map((t) => {
                  const a = temaAccuracy(t.id, qstats)
                  return (
                    <Link key={t.id} to={`/tema/${t.id}?tab=test`} className="grid grid-cols-[52px_1fr_60px] items-center gap-3 rounded-lg px-1 py-1 text-sm hover:bg-surface-2">
                      <span className="font-semibold text-muted">{temaLabel(t).replace('Tema ', '')}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" title={t.titulo}>
                        {a && <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${a.pct}%`, background: a.pct >= 70 ? '#10b981' : a.pct >= 50 ? '#f59e0b' : '#f43f5e' }} />}
                      </span>
                      <span className="text-right tabular-nums text-muted">{a ? `${a.pct}% · ${a.n}` : '—'}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Días de estudio</h2>
        <StudyHeatmap diario={diario} weeks={30} />
      </div>

      <div className="card mt-6 overflow-hidden">
        <h2 className="p-6 pb-3 font-display text-xl font-semibold">Historial</h2>
        {historial.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted">Todavía no hay resultados.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-6 py-2.5">Fecha</th><th className="px-3 py-2.5">Tipo</th><th className="px-3 py-2.5">Título</th><th className="px-3 py-2.5 text-right">✓</th><th className="px-3 py-2.5 text-right">✗</th><th className="px-3 py-2.5 text-right">—</th><th className="px-3 py-2.5 text-right">Tiempo</th><th className="px-6 py-2.5 text-right">Nota</th></tr>
              </thead>
              <tbody>
                {historial.slice(0, 100).map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-6 py-2.5 text-muted">{fmtFecha(h.fecha)}</td>
                    <td className="px-3 py-2.5">{TIPO[h.tipo]}</td>
                    <td className="max-w-xs truncate px-3 py-2.5">{h.titulo}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">{h.aciertos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-rose-600">{h.fallos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{h.blancos}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{fmtDuracion(h.segundos)}</td>
                    <td className={cn('px-6 py-2.5 text-right font-display text-base font-semibold', notaColor(h.nota))}>{fmtNota(h.nota)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
