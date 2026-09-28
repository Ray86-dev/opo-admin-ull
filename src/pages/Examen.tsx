import { useState } from 'react'
import { motion } from 'motion/react'
import {
  FileText, Users, Euro, GraduationCap, ClipboardList, Briefcase, Award, Calculator, Scale, Lightbulb, IdCard,
  ExternalLink, ListOrdered, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { PageHeader, stagger, AnimatedNumber } from '@/components/ui'
import { nota, fmtNota, notaColor } from '@/lib/scoring'
import { cn } from '@/lib/cn'
import { NORMAS } from '@/data/temario'

const FASES = [
  { t: 'Convocatoria', d: 'BOC nº 166, 19/08/2026. Resolución de 6 de agosto de 2026.', icon: FileText },
  { t: 'Solicitudes', d: '20 días hábiles por la sede electrónica de la ULL + pago de la tasa (15 €). Del 8 al 24 de agosto fue periodo inhábil.', icon: IdCard },
  { t: 'Lista provisional', d: 'Admitidos y excluidos. 10 días hábiles para subsanar por «Solicitud General».', icon: ListOrdered },
  { t: 'Lista definitiva', d: 'Con el Tribunal (5 titulares y 5 suplentes) y la fecha, hora y lugar del primer ejercicio.', icon: Users },
  { t: 'Primer ejercicio', d: 'Test de 100 preguntas (+10 de reserva) en 90 minutos. Eliminatorio.', icon: ClipboardList },
  { t: 'Segundo ejercicio', d: '3 supuestos de 4, con 15 preguntas cada uno, en 2 horas. Eliminatorio.', icon: Briefcase },
  { t: 'Concurso de méritos', d: '10 días hábiles para aportar méritos (solo quienes superan la oposición).', icon: Award },
  { t: 'Nombramiento', d: '10 días hábiles para presentar documentos, nombramiento en el BOC y toma de posesión en 15 días naturales (1 mes si cambias de residencia).', icon: GraduationCap },
]

export default function Examen() {
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show">
      <PageHeader
        eyebrow="Bases de la convocatoria"
        title="Cómo es el examen"
        subtitle="Todo lo que dicen las bases, explicado con claridad: el proceso, los dos ejercicios, cómo se corrigen, el concurso de méritos y la estrategia para sacar la máxima nota."
      >
        <a href={`normativa/${NORMAS.bases.archivo}`} target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">
          <FileText size={15} /> Bases (PDF)
        </a>
        <a href="https://sede.ull.es/ecivilis-site/catalog/showProcedure/505" target="_blank" rel="noreferrer" className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2">
          <ExternalLink size={15} /> Sede ULL
        </a>
      </PageHeader>

      {/* Datos clave */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact icon={<Users size={20} />} big={<AnimatedNumber value={47} />} label="plazas (5 para personas con discapacidad)" />
        <Fact icon={<GraduationCap size={20} />} big="C1" label="Escala Administrativa · Bachiller o Técnico" />
        <Fact icon={<Scale size={20} />} big="80 / 20" label="% oposición / concurso" />
        <Fact icon={<Euro size={20} />} big="15 €" label="derechos de examen" />
      </motion.div>

      {/* Línea temporal */}
      <motion.section variants={stagger.item} className="card mt-6 p-6 md:p-8">
        <h2 className="mb-6 font-display text-2xl font-semibold">El proceso, paso a paso</h2>
        <ol className="relative space-y-6 border-l-2 border-dashed border-line pl-8">
          {FASES.map((f, i) => (
            <motion.li key={f.t} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="relative">
              <span className="absolute -left-[3.05rem] grid size-10 place-items-center rounded-full border-4 border-paper bg-primary text-white dark:text-[#0d1016]">
                <f.icon size={16} />
              </span>
              <div className="font-semibold">{f.t}</div>
              <p className="text-[15px] leading-relaxed text-muted">{f.d}</p>
            </motion.li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
          El llamamiento empieza por la letra <b className="text-ink">«B»</b> del primer apellido (sorteo anual de la Dirección General de la Función Pública). Si no te presentas al llamamiento, quedas excluida. Lleva el <b className="text-ink">DNI</b>: el Tribunal puede pedirte que te identifiques en cualquier momento. No pongas firmas ni marcas en el examen: se anula.
        </p>
      </motion.section>

      {/* Ejercicios */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <motion.section variants={stagger.item} className="card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-white dark:text-[#0d1016]"><ClipboardList size={22} /></span>
            <div>
              <div className="text-sm font-semibold text-muted">Obligatorio y eliminatorio</div>
              <h2 className="font-display text-2xl font-semibold">Primer ejercicio</h2>
            </div>
          </div>
          <ul className="space-y-2.5 text-[15px] leading-relaxed">
            <Li>Cuestionario de <b>100 preguntas</b> tipo test sobre <b>todo el programa</b>, con 4 respuestas y solo una correcta.</Li>
            <Li><b>10 preguntas de reserva</b> que sustituyen, por orden, a las que se anulen.</Li>
            <Li>Tiempo máximo: <b>90 minutos</b> (54 segundos por pregunta).</Li>
            <Li>Nota de 0 a 10; hay que sacar <b>un 5</b> para aprobar.</Li>
            <Li>Todas valen igual. En blanco no puntúa. <b>Cada 3 errores restan 1 acierto</b> (o la parte proporcional).</Li>
            <Li>El Tribunal fija la puntuación directa mínima, que nunca puede ser inferior al <b>40 %</b> de la puntuación máxima, y publica antes los criterios de corrección.</Li>
          </ul>
          <div className="mt-5 rounded-2xl bg-primary-soft p-4 text-sm">
            <b>Fórmula:</b> nota = (aciertos − fallos ÷ 3) × 10 ÷ 100
          </div>
        </motion.section>

        <motion.section variants={stagger.item} className="card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-teal-600 text-white"><Briefcase size={22} /></span>
            <div>
              <div className="text-sm font-semibold text-muted">Obligatorio y eliminatorio</div>
              <h2 className="font-display text-2xl font-semibold">Segundo ejercicio</h2>
            </div>
          </div>
          <ul className="space-y-2.5 text-[15px] leading-relaxed">
            <Li>El Tribunal propone <b>4 supuestos prácticos</b>, uno por cada bloque del temario, y tú resuelves <b>3</b>.</Li>
            <Li>Cada supuesto tiene <b>15 preguntas</b> con 4 respuestas y solo una correcta.</Li>
            <Li>Misma penalización que en el primer ejercicio.</Li>
            <Li>Tiempo máximo: <b>2 horas</b> para los tres (unos 40 minutos por supuesto).</Li>
            <Li>Cada supuesto se puntúa de 0 a 10 y hay que sacar <b>al menos un 5 en cada uno</b>.</Li>
            <Li>La nota del ejercicio es la <b>media</b> de los tres supuestos.</Li>
          </ul>
          <div className="mt-5 flex gap-2 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" /> Un solo supuesto por debajo de 5 te deja fuera, aunque la media sea buena. Elige los tres que mejor domines.
          </div>
        </motion.section>
      </div>

      <Calculadora />
      <Estrategia />

      {/* Concurso y otros */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <motion.section variants={stagger.item} className="card p-6 md:p-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><Award size={22} className="text-amber-500" /> Fase de concurso</h2>
          <p className="mb-3 text-[15px] text-muted">Voluntaria y no eliminatoria. Solo se valora si superas la oposición y no sirve para aprobar los ejercicios. Los méritos se cuentan a la fecha de fin del plazo de solicitudes.</p>
          <h3 className="mt-4 font-semibold">Experiencia (máximo 5 puntos)</h3>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            <Li><b>0,50</b> por año en la Escala Administrativa de la ULL.</Li>
            <Li><b>0,30</b> por año en escala igual o análoga del mismo subgrupo (C1) en otra Administración o Universidad.</Li>
            <Li><b>0,05</b> por año en cualquier otra Administración pública.</Li>
          </ul>
          <h3 className="mt-4 font-semibold">Formación (máximo 5 puntos)</h3>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            <Li>Cursos oficiales: <b>0,10</b> (hasta 20 h), <b>0,15</b> (21 a 40 h) y <b>0,20</b> (más de 40 h).</Li>
            <Li>Titulación superior distinta de la exigida: <b>0,25</b> (solo una).</Li>
            <Li>No cuentan los cursos de preparación de oposiciones ni los de normativa derogada.</Li>
          </ul>
        </motion.section>
        <motion.section variants={stagger.item} className="card p-6 md:p-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><ListOrdered size={22} className="text-primary" /> Desempates y lista de empleo</h2>
          <p className="text-[15px] leading-relaxed">En caso de empate en la nota final se atiende, por este orden, a:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px]">
            <li>La mayor nota de la fase de oposición.</li>
            <li>La nota del primer ejercicio (teórico).</li>
            <li>La nota del segundo ejercicio (práctico).</li>
            <li>La nota del concurso.</li>
          </ol>
          <p className="mt-4 text-[15px] leading-relaxed">
            <b>Lista de empleo para interinidades.</b> El primer turno lo forman quienes aprueban sin plaza, ordenados por la media de los ejercicios. El segundo, quienes <b>superen solo el primer ejercicio</b>, ordenados por su nota. Aprobar el test ya tiene premio.
          </p>
          <p className="mt-3 text-sm text-muted">Tras cada ejercicio se publican las notas y la plantilla de respuestas, con 3 a 5 días hábiles para pedir revisión.</p>
        </motion.section>
      </div>
    </motion.div>
  )
}

function Fact({ icon, big, label }: { icon: React.ReactNode; big: React.ReactNode; label: string }) {
  return (
    <div className="card p-5">
      <div className="text-primary">{icon}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{big}</div>
      <div className="mt-1 text-sm leading-snug text-muted">{label}</div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <CheckCircle2 size={17} className="mt-1 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  )
}

function Num({ label, value, onChange, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; max: number; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        className="focus-ring mt-1 h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-[16px] font-semibold tabular-nums outline-none"
      />
    </label>
  )
}

function Calculadora() {
  const [a1, setA1] = useState(70)
  const [f1, setF1] = useState(18)
  const [sup, setSup] = useState([
    [11, 3],
    [10, 3],
    [12, 2],
  ])
  const [ull, setUll] = useState(0)
  const [ana, setAna] = useState(0)
  const [otras, setOtras] = useState(0)
  const [c20, setC20] = useState(0)
  const [c40, setC40] = useState(0)
  const [cmas, setCmas] = useState(0)
  const [tit, setTit] = useState(false)

  const n1 = nota(a1, Math.min(f1, 100 - a1), 100)
  const ns = sup.map(([a, f]) => nota(a, Math.min(f, 15 - a), 15))
  const n2 = ns.reduce((s, x) => s + x, 0) / 3
  const ok1 = n1 >= 5
  const ok2 = ns.every((x) => x >= 5)
  const oposicion = (n1 + n2) / 2
  const exp = Math.min(5, ull * 0.5 + ana * 0.3 + otras * 0.05)
  const form = Math.min(5, c20 * 0.1 + c40 * 0.15 + cmas * 0.2 + (tit ? 0.25 : 0))
  const concurso = exp + form
  const final = oposicion * 0.8 + concurso * 0.2

  return (
    <motion.section variants={stagger.item} className="card mt-6 p-6 md:p-8">
      <h2 className="mb-1 flex items-center gap-2 font-display text-2xl font-semibold"><Calculator size={22} className="text-primary" /> Calculadora de nota</h2>
      <p className="mb-6 text-sm text-muted">Juega con los números para ver cuánto necesitas. Las preguntas que no marques como aciertos o fallos cuentan como en blanco.</p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="mb-3 font-semibold">Primer ejercicio</div>
          <div className="grid grid-cols-2 gap-3">
            <Num label="Aciertos" value={a1} onChange={setA1} max={100} />
            <Num label="Fallos" value={f1} onChange={(v) => setF1(Math.min(v, 100 - a1))} max={100} />
          </div>
          <div className="mt-3 text-sm text-muted">En blanco: {100 - a1 - Math.min(f1, 100 - a1)}</div>
          <div className={cn('mt-2 font-display text-3xl font-semibold', notaColor(n1))}>{fmtNota(n1)}</div>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="mb-3 font-semibold">Segundo ejercicio (aciertos / fallos de 15)</div>
          {sup.map(([a, f], i) => (
            <div key={i} className="mb-2 grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
              <span className="pb-3 text-xs font-bold text-muted">S{i + 1}</span>
              <Num label="Aciertos" value={a} onChange={(v) => setSup((s) => s.map((x, k) => (k === i ? [v, Math.min(x[1], 15 - v)] : x)))} max={15} />
              <Num label="Fallos" value={f} onChange={(v) => setSup((s) => s.map((x, k) => (k === i ? [x[0], Math.min(v, 15 - x[0])] : x)))} max={15} />
              <span className={cn('pb-3 text-sm font-bold tabular-nums', notaColor(ns[i]))}>{fmtNota(ns[i])}</span>
            </div>
          ))}
          <div className={cn('mt-1 font-display text-3xl font-semibold', ok2 ? notaColor(n2) : 'text-rose-600')}>{fmtNota(n2)}</div>
          {!ok2 && <div className="text-xs font-semibold text-rose-600">Algún supuesto no llega al 5</div>}
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="mb-3 font-semibold">Concurso de méritos</div>
          <div className="grid grid-cols-3 gap-2">
            <Num label="Años ULL" value={ull} onChange={setUll} max={40} step={0.5} />
            <Num label="Años C1 otra AP" value={ana} onChange={setAna} max={40} step={0.5} />
            <Num label="Años otras AP" value={otras} onChange={setOtras} max={40} step={0.5} />
            <Num label="Cursos ≤20 h" value={c20} onChange={setC20} max={60} />
            <Num label="Cursos 21–40 h" value={c40} onChange={setC40} max={60} />
            <Num label="Cursos >40 h" value={cmas} onChange={setCmas} max={60} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tit} onChange={(e) => setTit(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Titulación superior adicional
          </label>
          <div className="mt-2 text-sm text-muted">Experiencia {fmtNota(exp)} + formación {fmtNota(form)}</div>
          <div className="font-display text-3xl font-semibold">{fmtNota(concurso)}<span className="text-base text-muted"> / 10</span></div>
        </div>
      </div>
      <div className={cn('mt-6 flex flex-col items-center gap-2 rounded-2xl p-6 text-center md:flex-row md:justify-between md:text-left', ok1 && ok2 ? 'bg-emerald-500/10' : 'bg-rose-500/10')}>
        <div>
          <div className="text-sm font-semibold text-muted">Nota final estimada</div>
          <div className="text-sm text-muted">
            0,8 × oposición ({fmtNota(oposicion)}) + 0,2 × concurso ({fmtNota(concurso)})
          </div>
        </div>
        <div className={cn('font-display text-5xl font-semibold', ok1 && ok2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600')}>
          {ok1 && ok2 ? fmtNota(final) : 'No apta'}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Estimación: se aplica el 80/20 de las bases sobre una escala de 10, con el concurso sobre 10 (5 + 5). El Tribunal puede fijar una puntuación directa mínima distinta de 5 en el primer ejercicio, nunca inferior al 40 %.
      </p>
    </motion.section>
  )
}

function Estrategia() {
  const rows = [
    { k: 4, label: 'No descartas ninguna' },
    { k: 3, label: 'Descartas 1 opción' },
    { k: 2, label: 'Dudas entre 2' },
    { k: 1, label: 'Lo sabes' },
  ]
  const ev = (k: number) => 1 / k - (1 - 1 / k) / 3
  return (
    <motion.section variants={stagger.item} className="card mt-6 p-6 md:p-8">
      <h2 className="mb-1 flex items-center gap-2 font-display text-2xl font-semibold"><Lightbulb size={22} className="text-amber-500" /> ¿Contesto o la dejo en blanco?</h2>
      <p className="mb-6 max-w-3xl text-[15px] leading-relaxed text-muted">
        Con 4 opciones y la penalización de 1/3, contestar completamente al azar tiene una ganancia esperada de <b className="text-ink">cero</b>: ni ganas ni pierdes de media. En cuanto puedes <b className="text-ink">descartar una sola opción</b> con seguridad, arriesgar sale a cuenta.
      </p>
      <div className="space-y-3">
        {rows.map((r) => {
          const v = ev(r.k)
          return (
            <div key={r.k} className="grid grid-cols-[150px_1fr_80px] items-center gap-3 text-sm md:grid-cols-[220px_1fr_90px]">
              <span className="font-semibold">{r.label}</span>
              <div className="h-7 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="flex h-full items-center justify-end rounded-full pr-2 text-xs font-bold text-white"
                  style={{ background: v <= 0.001 ? '#94a3b8' : v < 0.2 ? '#f59e0b' : '#10b981' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(4, v * 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
              </div>
              <span className="text-right font-bold tabular-nums">{v >= 0 ? '+' : ''}{v.toFixed(2)} ptos</span>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted">Ganancia esperada por pregunta, en «aciertos netos».</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          'Primera vuelta: contesta todas las que sepas seguro. Marca las dudosas y sigue.',
          'Segunda vuelta: vuelve a las dudosas. Si descartas al menos una opción, contesta.',
          'Reserva 5 minutos para pasar las respuestas a la hoja sin prisas y revisar.',
        ].map((t, i) => (
          <div key={i} className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed">
            <span className="mb-1 block font-display text-2xl font-semibold text-primary">{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
    </motion.section>
  )
}
