import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { todayKey } from '@/lib/dates'

export function Sparkline({ values, max, color = 'var(--primary)', height = 44 }: { values: number[]; max?: number; color?: string; height?: number }) {
  const w = 300
  if (values.length < 2) return <div className="h-11 text-xs text-muted">Haz al menos dos para ver la evolución.</div>
  const m = max ?? Math.max(...values, 1)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - 4 - (v / m) * (height - 8)] as const)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const five = height - 4 - (5 / m) * (height - 8)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {max === 10 && <line x1={0} x2={w} y1={five} y2={five} stroke="currentColor" strokeDasharray="3 4" className="text-muted/40" />}
      <motion.path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 0} fill={color} />
      ))}
    </svg>
  )
}

/** Gráfica de línea con eje de notas 0-10 y línea del aprobado */
export function ScoreChart({ points, color = 'var(--primary)' }: { points: { x: string; y: number }[]; color?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 640, h = 220, pl = 30, pb = 24, pt = 10
  if (points.length < 2) return <p className="py-10 text-center text-sm text-muted">Cuando hagas al menos dos tests verás aquí tu evolución.</p>
  const X = (i: number) => pl + (i / (points.length - 1)) * (w - pl - 10)
  const Y = (v: number) => pt + (1 - v / 10) * (h - pt - pb)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i)},${Y(p.y)}`).join(' ')
  const area = `${d} L${X(points.length - 1)},${Y(0)} L${X(0)},${Y(0)} Z`
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 2.5, 5, 7.5, 10].map((v) => (
          <g key={v}>
            <line x1={pl} x2={w - 10} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeDasharray={v === 5 ? '0' : '3 5'} strokeWidth={v === 5 ? 1.5 : 1} />
            <text x={pl - 8} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{v}</text>
          </g>
        ))}
        <motion.path d={area} fill="url(#scoreFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
        <motion.path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeOut' }} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={X(i)} cy={Y(p.y)} r={12} fill="transparent" />
            <circle cx={X(i)} cy={Y(p.y)} r={hover === i ? 5.5 : 3.5} fill="var(--surface)" stroke={color} strokeWidth={2} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-paper shadow-lg" style={{ left: `${(X(hover) / w) * 100}%`, top: `${(Y(points[hover].y) / h) * 100}%`, transform: 'translate(-50%, -130%)' }}>
          {points[hover].y.toFixed(2)} · {points[hover].x}
        </div>
      )}
    </div>
  )
}

/** Calendario de estudio tipo "contribuciones" */
export function StudyHeatmap({ diario, weeks = 20 }: { diario: Record<string, number>; weeks?: number }) {
  const days = useMemo(() => {
    const out: { key: string; v: number; date: Date }[] = []
    const end = new Date()
    const start = new Date(end)
    start.setDate(end.getDate() - weeks * 7 + 1)
    // alinear al lunes
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push({ key: todayKey(d), v: diario[todayKey(d)] ?? 0, date: new Date(d) })
    return out
  }, [diario, weeks])
  const cols: (typeof days)[] = []
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7))
  const level = (v: number) => (v <= 0 ? 0 : v < 30 ? 1 : v < 60 ? 2 : v < 120 ? 3 : 4)
  const bg = ['var(--surface-2)', 'color-mix(in oklab, var(--primary) 25%, var(--surface))', 'color-mix(in oklab, var(--primary) 45%, var(--surface))', 'color-mix(in oklab, var(--primary) 70%, var(--surface))', 'var(--primary)']
  return (
    <div className="thin-scroll overflow-x-auto">
      <div className="flex gap-[3px]">
        <div className="mr-1 flex flex-col gap-[3px] pt-0 text-[10px] text-muted">
          {['L', '', 'X', '', 'V', '', 'D'].map((d, i) => (
            <div key={i} className="h-[13px] leading-[13px]">{d}</div>
          ))}
        </div>
        {cols.map((c, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {c.map((d) => (
              <motion.div
                key={d.key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.015 }}
                title={`${d.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}: ${Math.round(d.v)} min`}
                className="size-[13px] rounded-[3px]"
                style={{ background: bg[level(d.v)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted">
        Menos {bg.map((b, i) => <span key={i} className="size-[11px] rounded-[3px]" style={{ background: b }} />)} Más
      </div>
    </div>
  )
}
