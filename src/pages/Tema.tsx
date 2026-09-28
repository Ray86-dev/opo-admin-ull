import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  BookOpen, FileText, Network, KeyRound, Layers, ListChecks, PlayCircle, NotebookPen, ChevronLeft, ChevronRight,
  Scale, Clock3, Lightbulb, BookA, ExternalLink, Play, CheckCircle2, Hourglass, Search, Download,
} from 'lucide-react'
import { TEMAS, NORMAS, temaById, temaLabel, bloqueById } from '@/data/temario'
import { loadDatos, loadEsquema, loadResumen, loadTema, type DatosTema } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { useProgress, emptyTema, type EstadoTema } from '@/store/progress'
import { Article } from '@/components/Article'
import { MindMap } from '@/components/MindMap'
import { FlashcardDeck, type DeckCard } from '@/components/FlashcardDeck'
import { QuizRunner, type QuizQuestion } from '@/components/QuizRunner'
import { VideoCard, youtubeSearch } from '@/components/VideoCard'
import { BloqueBadge, Button, Empty, LoadingArticle, Tabs, stagger } from '@/components/ui'
import { shuffle, shuffleOptions } from '@/lib/shuffle'
import { cn } from '@/lib/cn'
import { downloadFichaTema } from '@/lib/pdf'

type Tab = 'leer' | 'resumen' | 'esquema' | 'claves' | 'flashcards' | 'test' | 'videos' | 'notas'

const ESTADOS: { id: EstadoTema; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: '#94a3b8' },
  { id: 'estudiando', label: 'Estudiando', color: '#f59e0b' },
  { id: 'estudiado', label: 'Estudiado', color: '#3b82f6' },
  { id: 'dominado', label: 'Dominado', color: '#10b981' },
]

export default function TemaPage() {
  const { id = '' } = useParams()
  const tema = temaById(id)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'leer'
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true })
  const progress = useProgress((s) => s.temas[id]) ?? emptyTema()
  const updateTema = useProgress((s) => s.updateTema)
  const { data: datos } = useAsync(() => loadDatos(id), [id])

  if (!tema) return <Empty title="Tema no encontrado" />
  const b = bloqueById(tema.bloque)
  const idx = TEMAS.findIndex((t) => t.id === id)
  const prev = TEMAS[idx - 1]
  const next = TEMAS[idx + 1]

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'leer', label: 'Tema completo', icon: <BookOpen size={15} /> },
    { id: 'resumen', label: 'Resumen', icon: <FileText size={15} /> },
    { id: 'esquema', label: 'Esquema', icon: <Network size={15} /> },
    { id: 'claves', label: 'Claves y plazos', icon: <KeyRound size={15} /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={15} /> },
    { id: 'test', label: 'Test', icon: <ListChecks size={15} /> },
    { id: 'videos', label: 'Vídeos', icon: <PlayCircle size={15} /> },
    { id: 'notas', label: 'Mis notas', icon: <NotebookPen size={15} /> },
  ]

  return (
    <div>
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-line p-6 md:p-9" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${b.hex} 14%, var(--surface)), var(--surface) 65%)` }}>
        <div className="absolute -right-16 -top-16 size-56 rounded-full opacity-25 blur-3xl" style={{ background: b.hex }} />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link to="/temario" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              <ChevronLeft size={16} /> Temario
            </Link>
            <BloqueBadge bloque={tema.bloque} />
            <span className="text-sm font-semibold" style={{ color: b.hex }}>{temaLabel(tema)}</span>
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-[2.5rem]">{tema.titulo}</h1>
          <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-muted">{tema.epigrafe}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                onClick={() => updateTema(id, { estado: e.id, ...(e.id === 'dominado' && progress.estado !== 'dominado' ? { vueltas: progress.vueltas + 1 } : {}) })}
                className={cn('flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition', progress.estado === e.id ? 'border-transparent text-white' : 'border-line bg-surface text-muted hover:text-ink')}
                style={progress.estado === e.id ? { background: e.color } : undefined}
              >
                {progress.estado === e.id ? <CheckCircle2 size={13} /> : <span className="size-2 rounded-full" style={{ background: e.color }} />}
                {e.label}
              </button>
            ))}
            <span className="ml-1 text-xs text-muted">Leído {progress.leido} %</span>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => downloadFichaTema(id)}>
              <Download size={15} /> Ficha PDF
            </Button>
          </div>
        </div>
      </motion.div>

      <div className={cn('-mx-4 mb-8 bg-paper/85 px-4 py-2 backdrop-blur-xl md:-mx-8 md:px-8', tab !== 'test' && 'sticky top-16 z-20')}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      <div key={tab}>
        {tab === 'leer' && <TextTab id={id} loader={loadTema} title={tema.titulo} source={`tema-${id}`} temaId={id} />}
        {tab === 'resumen' && <TextTab id={id} loader={loadResumen} title={`Resumen · ${tema.titulo}`} source={`resumen-${id}`} />}
        {tab === 'esquema' && <EsquemaTab id={id} />}
        {tab === 'claves' && <ClavesTab datos={datos} normas={tema.normas} />}
        {tab === 'flashcards' && <FlashTab id={id} datos={datos} />}
        {tab === 'test' && <TestTab id={id} datos={datos} titulo={tema.titulo} />}
        {tab === 'videos' && <VideosTab datos={datos} titulo={tema.titulo} />}
        {tab === 'notas' && (
          <div className="mx-auto max-w-3xl">
            <textarea
              value={progress.notas}
              onChange={(e) => updateTema(id, { notas: e.target.value })}
              placeholder="Escribe aquí tus apuntes, dudas o reglas para recordar este tema… Se guardan solas."
              className="focus-ring card min-h-[50vh] w-full resize-y p-6 font-serif text-[17px] leading-relaxed outline-none"
            />
          </div>
        )}
      </div>

      {/* Navegación entre temas */}
      <div className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <Link to={`/tema/${prev.id}?tab=${tab}`} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
            <ChevronLeft className="text-muted transition group-hover:-translate-x-1" />
            <div className="min-w-0">
              <div className="text-xs text-muted">Anterior · {temaLabel(prev)}</div>
              <div className="truncate font-semibold">{prev.titulo}</div>
            </div>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/tema/${next.id}?tab=${tab}`} className="card group flex items-center justify-end gap-3 p-4 text-right transition hover:-translate-y-0.5">
            <div className="min-w-0">
              <div className="text-xs text-muted">Siguiente · {temaLabel(next)}</div>
              <div className="truncate font-semibold">{next.titulo}</div>
            </div>
            <ChevronRight className="text-muted transition group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  )
}

function Pendiente({ que }: { que: string }) {
  return (
    <Empty icon={<Hourglass size={26} />} title={`${que} en preparación`}>
      Este contenido todavía se está redactando a partir de la normativa oficial. Aparecerá aquí automáticamente cuando esté listo.
    </Empty>
  )
}

function TextTab({ id, loader, title, source, temaId }: { id: string; loader: (id: string) => Promise<string | null>; title: string; source: string; temaId?: string }) {
  const { data, loading } = useAsync(() => loader(id), [id, loader])
  if (loading) return <LoadingArticle />
  if (!data) return <Pendiente que="El texto" />
  return <Article md={data} title={title} source={source} temaId={temaId} />
}

function EsquemaTab({ id }: { id: string }) {
  const { data, loading } = useAsync(() => loadEsquema(id), [id])
  if (loading) return <LoadingArticle />
  if (!data) return <Pendiente que="El esquema" />
  return <MindMap md={data} />
}

function ClavesTab({ datos, normas }: { datos?: DatosTema | null; normas: string[] }) {
  if (datos === undefined) return <LoadingArticle />
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-2">
      {datos && datos.claves.length > 0 && (
        <motion.section variants={stagger.item} className="card p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><KeyRound size={19} className="text-primary" /> Ideas clave</h2>
          <ol className="grid gap-3 md:grid-cols-2">
            {datos.claves.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-surface-2 p-4 text-[15px] leading-relaxed">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white dark:text-[#0d1016]">{i + 1}</span>
                {c}
              </li>
            ))}
          </ol>
        </motion.section>
      )}
      {datos && datos.plazos.length > 0 && (
        <motion.section variants={stagger.item} className="card overflow-hidden lg:col-span-2">
          <h2 className="flex items-center gap-2 p-6 pb-3 font-display text-xl font-semibold"><Clock3 size={19} className="text-amber-500" /> Plazos, cifras y porcentajes</h2>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-[14.5px]">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-6 py-2.5">Concepto</th><th className="px-4 py-2.5">Valor</th><th className="px-6 py-2.5">Referencia</th></tr>
              </thead>
              <tbody>
                {datos.plazos.map((p, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-6 py-3">{p.concepto}</td>
                    <td className="px-4 py-3 font-bold text-amber-700 dark:text-amber-300">{p.valor}</td>
                    <td className="px-6 py-3 text-muted">{p.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}
      {datos && datos.mnemotecnias.length > 0 && (
        <motion.section variants={stagger.item} className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><Lightbulb size={19} className="text-violet-500" /> Reglas mnemotécnicas</h2>
          <div className="space-y-3">
            {datos.mnemotecnias.map((m, i) => (
              <div key={i} className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4">
                <div className="font-semibold text-violet-700 dark:text-violet-300">{m.titulo}</div>
                <div className="mt-1 text-[15px] leading-relaxed">{m.texto}</div>
              </div>
            ))}
          </div>
        </motion.section>
      )}
      {datos && datos.glosario.length > 0 && (
        <motion.section variants={stagger.item} className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><BookA size={19} className="text-teal-500" /> Glosario del tema</h2>
          <dl className="space-y-3">
            {datos.glosario.map((g, i) => (
              <div key={i}>
                <dt className="font-semibold">{g.termino}</dt>
                <dd className="text-[15px] leading-relaxed text-muted">{g.definicion}</dd>
              </div>
            ))}
          </dl>
        </motion.section>
      )}
      <motion.section variants={stagger.item} className="card p-6 lg:col-span-2">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><Scale size={19} className="text-primary" /> Normativa de este tema</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {normas.map((k) => NORMAS[k]).filter(Boolean).map((n) => (
            <div key={n.archivo} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <Scale size={16} className="shrink-0 text-muted" />
              <span className="flex-1 text-sm font-medium">{n.nombre}</span>
              <a href={`normativa/${n.archivo}`} target="_blank" rel="noreferrer" className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-soft">PDF</a>
              {n.boe && <a href={n.boe} target="_blank" rel="noreferrer" className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Fuente oficial"><ExternalLink size={14} /></a>}
            </div>
          ))}
          {datos?.enlaces.map((e, i) => (
            <a key={i} href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-sm font-medium hover:text-primary">
              <ExternalLink size={16} className="shrink-0 text-muted" /> {e.titulo}
            </a>
          ))}
        </div>
      </motion.section>
      {!datos && <div className="lg:col-span-2"><Pendiente que="Las claves" /></div>}
    </motion.div>
  )
}

function FlashTab({ id, datos }: { id: string; datos?: DatosTema | null }) {
  const cards = useMemo<DeckCard[]>(() => (datos?.flashcards ?? []).map((f, i) => ({ ...f, id: `${id}~${i}`, temaId: id })), [datos, id])
  if (datos === undefined) return <LoadingArticle />
  if (!cards.length) return <Pendiente que="Las flashcards" />
  return <FlashcardDeck cards={cards} />
}

function TestTab({ id, datos, titulo }: { id: string; datos?: DatosTema | null; titulo: string }) {
  const [run, setRun] = useState<QuizQuestion[] | null>(null)
  const [mode, setMode] = useState<'practica' | 'examen'>('practica')
  const [n, setN] = useState(20)
  const qstats = useProgress((s) => s.qstats)
  const all = useMemo<QuizQuestion[]>(() => (datos?.preguntas ?? []).map((p, i) => ({ ...p, id: `${id}#${i}`, temaId: id })), [datos, id])
  useEffect(() => setRun(null), [id])
  if (datos === undefined) return <LoadingArticle />
  if (!all.length) return <Pendiente que="El test" />

  const vistas = all.filter((q) => qstats[q.id]).length
  const falladas = all.filter((q) => qstats[q.id] && !qstats[q.id].ok)
  const start = (list: QuizQuestion[]) => setRun(shuffle(list).slice(0, n).map(shuffleOptions))

  if (run)
    return (
      <QuizRunner
        key={run.map((q) => q.id).join()}
        title={`Test · ${titulo}`}
        preguntas={run}
        mode={mode}
        recordTipo="test"
        onExit={() => setRun(null)}
        onRetry={(f) => setRun(shuffle(f).map(shuffleOptions))}
      />
    )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6 md:p-8">
        <h2 className="font-display text-2xl font-semibold">Test del tema</h2>
        <p className="mt-1 text-muted">
          {all.length} preguntas en el banco · has visto {vistas} · {falladas.length} falladas la última vez
        </p>
        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-2 text-sm font-semibold">Modo</div>
            <div className="grid grid-cols-2 gap-2">
              {(['practica', 'examen'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn('cursor-pointer rounded-2xl border-2 p-4 text-left transition', mode === m ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/40')}>
                  <div className="font-semibold">{m === 'practica' ? 'Práctica' : 'Examen'}</div>
                  <div className="text-sm text-muted">{m === 'practica' ? 'Corrección y explicación al momento' : 'Corrección al final, con penalización'}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Número de preguntas: {Math.min(n, all.length)}</div>
            <input type="range" min={5} max={all.length} step={5} value={Math.min(n, all.length)} onChange={(e) => setN(+e.target.value)} className="w-full accent-[var(--primary)]" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => start(all)}><Play size={16} /> Empezar</Button>
            {falladas.length > 0 && <Button variant="secondary" onClick={() => start(falladas)}>Solo las falladas ({falladas.length})</Button>}
            <Button variant="ghost" onClick={() => start(all.filter((q) => !qstats[q.id]))} disabled={vistas === all.length}>Solo las nuevas</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideosTab({ datos, titulo }: { datos?: DatosTema | null; titulo: string }) {
  if (datos === undefined) return <LoadingArticle />
  const videos = datos?.videos ?? []
  return (
    <div>
      {videos.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => <VideoCard key={v.url} {...v} />)}
        </div>
      ) : (
        <Empty icon={<PlayCircle size={26} />} title="Sin vídeos seleccionados todavía" />
      )}
      <a href={youtubeSearch(`${titulo} oposiciones`)} target="_blank" rel="noreferrer" className="card mt-6 flex items-center gap-3 p-4 text-sm font-semibold transition hover:-translate-y-0.5">
        <Search size={17} className="text-primary" /> Buscar más vídeos sobre «{titulo}» en YouTube <ExternalLink size={14} className="ml-auto text-muted" />
      </a>
    </div>
  )
}
