import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { Headphones, Pause, Type, Minus, Plus, ListTree, ArrowDownToLine } from 'lucide-react'
import { Markdown, tocOf, wordCount } from './Markdown'
import { speaker, segmentsFromContainer, useTts, ttsSupported } from '@/lib/tts'
import { useProgress } from '@/store/progress'
import { cn } from '@/lib/cn'
import { Button } from './ui'

interface Props {
  md: string
  title: string
  source: string
  /** guarda % leído y posición en el progreso del tema */
  temaId?: string
  compact?: boolean
}

export function Article({ md, title, source, temaId, compact }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { fuenteLectura, tamLectura } = useProgress((s) => s.settings)
  const setSettings = useProgress((s) => s.setSettings)
  const updateTema = useProgress((s) => s.updateTema)
  const saved = useProgress((s) => (temaId ? s.temas[temaId] : undefined))
  const tts = useTts()
  const listening = tts.active && tts.source === source
  const toc = useMemo(() => tocOf(md), [md])
  const words = useMemo(() => wordCount(md), [md])
  const [activeId, setActiveId] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(false)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80px', 'end end'] })
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  // Guardar progreso de lectura
  useEffect(() => {
    if (!temaId) return
    let t: ReturnType<typeof setTimeout>
    const unsub = scrollYProgress.on('change', (v) => {
      clearTimeout(t)
      t = setTimeout(() => {
        const pct = Math.round(v * 100)
        const prev = useProgress.getState().temas[temaId]
        updateTema(temaId, {
          scroll: v,
          leido: Math.max(prev?.leido ?? 0, pct),
          ...(prev?.estado === undefined || prev.estado === 'pendiente' ? { estado: 'estudiando' as const } : {}),
        })
      }, 600)
    })
    return () => {
      unsub()
      clearTimeout(t)
    }
  }, [temaId, scrollYProgress, updateTema])

  // Scrollspy del índice
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const hs = Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]'))
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActiveId(vis[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    hs.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [md])

  // Ir al ancla de la URL (desde el buscador)
  useEffect(() => {
    const hash = window.location.hash.split('#')[2]
    if (hash) setTimeout(() => document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ behavior: 'smooth' }), 300)
  }, [md])

  useEffect(() => () => {
    if (useTts.getState().source === source) speaker.stop()
  }, [source])

  const listenFrom = (el?: HTMLElement) => {
    if (!ref.current) return
    const segs = segmentsFromContainer(ref.current)
    const start = el ? Math.max(0, segs.findIndex((s) => s.el === el || s.el?.contains(el))) : 0
    speaker.load(segs, { title, source, start })
  }

  const onClickText = (e: React.MouseEvent) => {
    if (!listening) return
    const el = (e.target as HTMLElement).closest('p, li, h2, h3, h4, tr') as HTMLElement | null
    if (el && ref.current?.contains(el)) listenFrom(el)
  }

  const minutes = Math.max(1, Math.round(words / 200))

  return (
    <div className={cn('relative', !compact && 'xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:gap-10')}>
      <motion.div className="fixed inset-x-0 top-16 z-30 h-[3px] origin-left bg-primary lg:left-64" style={{ scaleX: bar }} />
      <div>
        {/* Controles de lectura */}
        <div className="no-print mb-6 flex flex-wrap items-center gap-2">
          {ttsSupported && (
            <Button
              size="sm"
              variant={listening && tts.playing ? 'primary' : 'soft'}
              onClick={() => (listening ? speaker.toggle() : listenFrom())}
            >
              {listening && tts.playing ? <Pause size={15} /> : <Headphones size={15} />}
              {listening ? (tts.playing ? 'Pausar' : 'Reanudar') : 'Escuchar'}
            </Button>
          )}
          {temaId && saved && saved.scroll > 0.03 && saved.scroll < 0.97 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const r = ref.current!.getBoundingClientRect()
                window.scrollTo({ top: window.scrollY + r.top + (r.height - window.innerHeight) * saved.scroll, behavior: 'smooth' })
              }}
            >
              <ArrowDownToLine size={15} /> Continuar ({Math.round(saved.scroll * 100)} %)
            </Button>
          )}
          <span className="text-xs text-muted">
            {words.toLocaleString('es-ES')} palabras · {minutes} min de lectura
          </span>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            <button
              onClick={() => setSettings({ fuenteLectura: fuenteLectura === 'serif' ? 'sans' : 'serif' })}
              className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-semibold hover:bg-surface-2"
              title="Cambiar tipo de letra"
            >
              <Type size={14} /> {fuenteLectura === 'serif' ? 'Serif' : 'Sans'}
            </button>
            <button onClick={() => setSettings({ tamLectura: Math.max(15, tamLectura - 1) })} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2" aria-label="Reducir texto">
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-xs font-semibold tabular-nums">{tamLectura}</span>
            <button onClick={() => setSettings({ tamLectura: Math.min(26, tamLectura + 1) })} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2" aria-label="Aumentar texto">
              <Plus size={14} />
            </button>
            {toc.length > 0 && !compact && (
              <button onClick={() => setTocOpen((o) => !o)} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-surface-2 xl:hidden" aria-label="Índice">
                <ListTree size={15} />
              </button>
            )}
          </div>
        </div>

        {tocOpen && (
          <div className="card mb-6 p-4 xl:hidden">
            <Toc toc={toc} activeId={activeId} onPick={() => setTocOpen(false)} />
          </div>
        )}

        {listening && <p className="no-print mb-4 rounded-xl bg-primary-soft px-4 py-2 text-sm text-primary">Pulsa cualquier párrafo para que la lectura continúe desde ahí.</p>}

        <div ref={ref} onClick={onClickText} className={cn(listening && 'reading-mode')} style={{ ['--fs' as string]: `${tamLectura}px` }}>
          <Markdown source={md} className={cn('prose-opo', fuenteLectura)} />
        </div>
      </div>

      {!compact && toc.length > 0 && (
        <aside className="no-print hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto thin-scroll pr-2">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">En este tema</div>
            <Toc toc={toc} activeId={activeId} />
          </div>
        </aside>
      )}
    </div>
  )
}

function Toc({ toc, activeId, onPick }: { toc: ReturnType<typeof tocOf>; activeId: string; onPick?: () => void }) {
  return (
    <nav className="flex flex-col border-l border-line">
      {toc.map((t) => (
        <a
          key={t.id + t.text}
          href={`#${t.id}`}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' })
            onPick?.()
          }}
          className={cn(
            '-ml-px border-l-2 py-1.5 text-[13px] leading-snug transition-colors',
            t.level === 3 ? 'pl-6' : 'pl-3 font-medium',
            activeId === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.text}
        </a>
      ))}
    </nav>
  )
}
