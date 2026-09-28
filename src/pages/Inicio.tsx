import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Flame, BookOpen, Layers, Zap, ClipboardList, ArrowRight, Target, CalendarClock, TrendingDown, Lightbulb, Trophy, Sparkles,
} from 'lucide-react'
import { BLOQUES, TEMAS, temaById, temaLabel, bloqueById } from '@/data/temario'
import { loadAllDatos } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { useProgress, emptyTema } from '@/store/progress'
import { daysUntil, saludo, streak, todayKey, fmtFecha } from '@/lib/dates'
import { isDue } from '@/lib/srs'
import { fmtNota, notaColor } from '@/lib/scoring'
import { AnimatedNumber, ProgressRing, stagger } from '@/components/ui'
import { StudyHeatmap } from '@/components/Charts'
import { temaAccuracy } from './Temario'
import { cn } from '@/lib/cn'

const CONSEJOS = [
  'En el test, cada 3 fallos restan un acierto. Si puedes descartar al menos una opción con seguridad, contestar tiene esperanza positiva.',
  'Repasa hoy lo que estudiaste ayer: el repaso a las 24 horas es el que más fija la memoria.',
  'Los plazos y las mayorías son las preguntas más «regaladas» si te los sabes. Dedica 10 minutos diarios a la tabla de plazos.',
  'Estudia por bloques de 25–45 minutos y descansa 5–10. Tu atención te lo agradecerá.',
  'Explica el tema en voz alta como si se lo contaras a alguien: si te atascas, ahí está lo que tienes que repasar.',
  'En el segundo ejercicio elige los tres supuestos que mejor domines: lee los cuatro enunciados por encima antes de empezar.',
  'Escuchar el resumen mientras paseas o conduces también cuenta como estudio. Usa el botón «Escuchar».',
  'Haz un simulacro completo cada semana desde un mes antes del examen, a la misma hora que será el real.',
  'Las preguntas con «NO», «EXCEPTO» o «INCORRECTA» son trampas clásicas: subráyalas mentalmente antes de contestar.',
  'Las leyes de procedimiento (39/2015) y régimen jurídico (40/2015) son las que más peso tienen: no las descuides nunca.',
  'Duerme bien: la memoria se consolida durante el sueño. Estudiar de madrugada la víspera suele restar más que sumar.',
  'Cuando falles una pregunta, lee la explicación y el artículo. Una pregunta entendida es una pregunta que no vuelves a fallar.',
]

export default function Inicio() {
  const st = useProgress()
  const { settings, temas, qstats, srs, historial, diario } = st
  const { data: datos } = useAsync(loadAllDatos, [])
  const dias = daysUntil(settings.fechaExamen)
  const hoy = diario[todayKey()] ?? 0
  const racha = streak(diario)
  const consejo = CONSEJOS[new Date().getDate() % CONSEJOS.length]

  const due = useMemo(() => {
    if (!datos) return null
    let n = 0
    for (const [id, d] of Object.entries(datos)) d.flashcards.forEach((_, i) => isDue(srs[`${id}~${i}`]) && n++)
    return n
  }, [datos, srs])

  const ultimo = useMemo(() => {
    const list = Object.entries(temas).filter(([, p]) => p.ultimo).sort((a, b) => (b[1].ultimo ?? 0) - (a[1].ultimo ?? 0))
    return list[0] ? { tema: temaById(list[0][0])!, p: list[0][1] } : null
  }, [temas])

  const debiles = useMemo(
    () =>
      TEMAS.map((t) => ({ t, acc: temaAccuracy(t.id, qstats) }))
        .filter((x) => x.acc && x.acc.n >= 5)
        .sort((a, b) => a.acc!.pct - b.acc!.pct)
        .slice(0, 4),
    [qstats],
  )

  const totalResp = Object.values(qstats).reduce((s, q) => s + q.aciertos + q.fallos, 0)
  const totalAc = Object.values(qstats).reduce((s, q) => s + q.aciertos, 0)
  const estudiados = TEMAS.filter((t) => ['estudiado', 'dominado'].includes(temas[t.id]?.estado ?? '')).length
  const nombre = settings.nombre ? `, ${settings.nombre}` : ''

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* HERO */}
      <motion.section variants={stagger.item} className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-white shadow-[0_30px_60px_-30px_var(--primary)] md:p-10 dark:text-[#0d1016]">
        <motion.div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/12" animate={{ scale: [1, 1.12, 1], rotate: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity }} />
        <motion.div className="absolute -bottom-28 right-40 size-64 rounded-full bg-white/8" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 9, repeat: Infinity }} />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold opacity-80">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {saludo()}
              {nombre}.
            </h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed opacity-90">
              {dias !== null && dias > 0 ? (
                <>
                  Quedan <b className="font-display text-2xl">{dias}</b> días para el primer ejercicio. Cada día cuenta: vamos a por la plaza.
                </>
              ) : dias === 0 ? (
                <>Hoy es el día. Respira, confía en todo lo que has estudiado y lee cada pregunta con calma. ¡Tú puedes!</>
              ) : (
                <>47 plazas en la Universidad de La Laguna. Una de ellas lleva tu nombre. Pon la fecha del examen en Ajustes para ver la cuenta atrás.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {ultimo ? (
                <Link to={`/tema/${ultimo.tema.id}`} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition hover:scale-[1.03] dark:bg-[#0d1016]">
                  <BookOpen size={17} /> Continuar: {temaLabel(ultimo.tema)} <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/tema/1-01" className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition hover:scale-[1.03] dark:bg-[#0d1016]">
                  <Sparkles size={17} /> Empezar por el Tema 1 <ArrowRight size={16} />
                </Link>
              )}
              <Link to="/test" className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25">
                <Zap size={17} /> Hacer un test
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={(hoy / settings.metaMinutos) * 100} size={132} stroke={11} color="#ffffff" track="rgba(255,255,255,0.2)">
              <div className="text-center">
                <div className="font-display text-3xl font-semibold"><AnimatedNumber value={Math.round(hoy)} /></div>
                <div className="text-[11px] font-semibold opacity-80">de {settings.metaMinutos} min</div>
              </div>
            </ProgressRing>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <motion.div animate={racha > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.6, repeat: Infinity }}>
                  <Flame size={26} className={racha > 0 ? 'text-amber-300' : 'opacity-50'} fill={racha > 0 ? 'currentColor' : 'none'} />
                </motion.div>
                <div>
                  <div className="font-display text-2xl font-semibold leading-none">{racha}</div>
                  <div className="text-[11px] opacity-80">días de racha</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target size={24} className="opacity-90" />
                <div>
                  <div className="font-display text-2xl font-semibold leading-none">{estudiados}/29</div>
                  <div className="text-[11px] opacity-80">temas estudiados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ACCIONES */}
      <motion.section variants={stagger.item} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickCard to="/flashcards" icon={<Layers size={20} />} color="#7c3aed" title="Flashcards" value={due === null ? '…' : `${due} para hoy`} />
        <QuickCard to="/repaso" icon={<TrendingDown size={20} />} color="#e11d48" title="Repaso de fallos" value={`${Object.values(qstats).filter((q) => !q.ok).length} preguntas`} />
        <QuickCard to="/simulacro" icon={<ClipboardList size={20} />} color="#0f9488" title="Simulacro" value={`${historial.filter((h) => h.tipo.startsWith('simulacro')).length} hechos`} />
        <QuickCard to="/plan" icon={<CalendarClock size={20} />} color="#d97706" title="Plan de estudio" value={dias && dias > 0 ? `${dias} días` : 'Organízate'} />
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* PROGRESO POR BLOQUE */}
        <motion.section variants={stagger.item} className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Tu progreso por bloques</h2>
            <span className="text-sm text-muted">{totalResp ? `${Math.round((totalAc / totalResp) * 100)} % de aciertos global` : 'Aún sin tests'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {BLOQUES.map((b) => {
              const ts = TEMAS.filter((t) => t.bloque === b.id)
              const leido = ts.reduce((s, t) => s + (temas[t.id] ?? emptyTema()).leido, 0) / ts.length
              let a = 0, f = 0
              ts.forEach((t) => {
                const x = temaAccuracy(t.id, qstats)
                if (x) {
                  a += (x.pct * x.n) / 100
                  f += x.n - (x.pct * x.n) / 100
                }
              })
              return (
                <Link key={b.id} to="/temario" className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition hover:bg-surface-2">
                  <ProgressRing value={leido} size={86} stroke={8} color={b.hex}>
                    <span className="font-display text-lg font-semibold">{Math.round(leido)}%</span>
                  </ProgressRing>
                  <div className="text-sm font-semibold leading-tight">{b.nombre}</div>
                  <div className="text-xs text-muted">{a + f ? `${Math.round((a / (a + f)) * 100)} % aciertos` : `${ts.length} temas`}</div>
                </Link>
              )
            })}
          </div>
        </motion.section>

        {/* CONSEJO */}
        <motion.section variants={stagger.item} className="card relative overflow-hidden p-6">
          <Lightbulb className="absolute -right-4 -top-4 size-28 text-amber-400/15" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
              <Lightbulb size={15} /> Consejo del día
            </div>
            <p className="font-display text-xl leading-snug">{consejo}</p>
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section variants={stagger.item} className="card p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Temas a reforzar</h2>
          {debiles.length === 0 ? (
            <p className="text-sm text-muted">Cuando respondas al menos 5 preguntas de un tema, aquí verás los que más te cuestan para priorizarlos.</p>
          ) : (
            <div className="space-y-3">
              {debiles.map(({ t, acc }) => (
                <Link key={t.id} to={`/tema/${t.id}?tab=test`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-2">
                  <span className="grid size-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: bloqueById(t.bloque).hex }}>{t.num}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.titulo}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${acc!.pct}%`, background: acc!.pct >= 70 ? '#10b981' : acc!.pct >= 50 ? '#f59e0b' : '#f43f5e' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{acc!.pct}%</span>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section variants={stagger.item} className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Últimos resultados</h2>
            <Link to="/estadisticas" className="text-sm font-semibold text-primary">Ver todo</Link>
          </div>
          {historial.length === 0 ? (
            <p className="text-sm text-muted">Aquí aparecerán tus tests y simulacros.</p>
          ) : (
            <div className="space-y-2.5">
              {historial.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className={cn('grid size-11 place-items-center rounded-xl bg-surface-2 font-display text-base font-semibold', notaColor(h.nota))}>{fmtNota(h.nota)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{h.titulo}</div>
                    <div className="text-xs text-muted">{fmtFecha(h.fecha)} · {h.aciertos} ✓ {h.fallos} ✗ {h.blancos} en blanco</div>
                  </div>
                  {h.nota >= 5 && <Trophy size={16} className="text-amber-500" />}
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <motion.section variants={stagger.item} className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Tu constancia</h2>
          <span className="text-sm text-muted">{Math.round(Object.values(diario).reduce((a, b) => a + b, 0) / 60)} horas de estudio registradas</span>
        </div>
        <StudyHeatmap diario={diario} weeks={22} />
      </motion.section>
    </motion.div>
  )
}

function QuickCard({ to, icon, color, title, value }: { to: string; icon: React.ReactNode; color: string; title: string; value: string }) {
  return (
    <Link to={to} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-1 hover:shadow-xl">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl transition group-hover:scale-110" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted">{value}</div>
      </div>
    </Link>
  )
}
