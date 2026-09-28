import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Search, FileText, BookA, Clock3, CornerDownLeft, Loader2 } from 'lucide-react'
import { loadAllDatos, loadAllTemaTexts } from '@/data/content'
import { TEMAS, temaById, temaLabel } from '@/data/temario'
import { slugify } from './Markdown'
import { cn } from '@/lib/cn'

interface Doc {
  kind: 'seccion' | 'glosario' | 'plazo' | 'tema'
  temaId: string
  title: string
  text: string
  norm: string
  href: string
}

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

let indexPromise: Promise<Doc[]> | null = null
function buildIndex(): Promise<Doc[]> {
  indexPromise ??= Promise.all([loadAllTemaTexts(), loadAllDatos()]).then(([texts, datos]) => {
    const docs: Doc[] = []
    for (const t of TEMAS) {
      docs.push({ kind: 'tema', temaId: t.id, title: `${temaLabel(t)} · ${t.titulo}`, text: t.epigrafe, norm: norm(t.titulo + ' ' + t.epigrafe), href: `/tema/${t.id}` })
      const md = texts[t.id]
      if (md) {
        const parts = md.split(/\n(?=##+\s)/)
        for (const p of parts) {
          const m = /^(##+)\s+(.+)/.exec(p)
          const title = m ? m[2].replace(/[*_`]/g, '').trim() : 'Introducción'
          const body = p.replace(/^##+.+\n/, '').replace(/[#>*_`|[\]!-]/g, ' ').replace(/\s+/g, ' ')
          docs.push({ kind: 'seccion', temaId: t.id, title, text: body, norm: norm(title + ' ' + body), href: `/tema/${t.id}?tab=leer#${slugify(title)}` })
        }
      }
      const d = datos[t.id]
      d?.glosario.forEach((g) => docs.push({ kind: 'glosario', temaId: t.id, title: g.termino, text: g.definicion, norm: norm(g.termino + ' ' + g.definicion), href: `/glosario?q=${encodeURIComponent(g.termino)}` }))
      d?.plazos.forEach((p) => docs.push({ kind: 'plazo', temaId: t.id, title: `${p.concepto}: ${p.valor}`, text: p.ref, norm: norm(p.concepto + ' ' + p.valor + ' ' + p.ref), href: `/plazos?q=${encodeURIComponent(p.concepto)}` }))
    }
    return docs
  })
  return indexPromise
}

function snippet(text: string, terms: string[]) {
  const n = norm(text)
  let pos = -1
  for (const t of terms) {
    pos = n.indexOf(t)
    if (pos >= 0) break
  }
  const start = Math.max(0, pos - 60)
  const s = (start > 0 ? '…' : '') + text.slice(start, start + 200) + (text.length > start + 200 ? '…' : '')
  return s
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const n = norm(text)
  const marks: [number, number][] = []
  for (const t of terms) {
    let i = n.indexOf(t)
    while (i >= 0 && t) {
      marks.push([i, i + t.length])
      i = n.indexOf(t, i + t.length)
    }
  }
  marks.sort((a, b) => a[0] - b[0])
  const out: React.ReactNode[] = []
  let cur = 0
  marks.forEach(([a, b], k) => {
    if (a < cur) return
    out.push(text.slice(cur, a))
    out.push(
      <mark key={k} className="rounded bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-500/30">
        {text.slice(a, b)}
      </mark>,
    )
    cur = b
  })
  out.push(text.slice(cur))
  return <>{out}</>
}

const ICON = { seccion: FileText, glosario: BookA, plazo: Clock3, tema: FileText }
const KIND = { seccion: 'Apartado', glosario: 'Glosario', plazo: 'Plazo / cifra', tema: 'Tema' }

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setSel(0)
    setTimeout(() => inputRef.current?.focus(), 50)
    buildIndex().then(setDocs)
  }, [open])

  const terms = useMemo(() => norm(q).split(/\s+/).filter((t) => t.length > 1), [q])
  const results = useMemo(() => {
    if (!docs || !terms.length) return []
    return docs
      .filter((d) => terms.every((t) => d.norm.includes(t)))
      .map((d) => {
        const titleN = norm(d.title)
        const score = terms.reduce((s, t) => s + (titleN.includes(t) ? 10 : 0) + d.norm.split(t).length - 1, 0) + (d.kind === 'tema' ? 6 : d.kind === 'glosario' ? 4 : 0)
        return { d, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => r.d)
  }, [docs, terms])

  const go = (d: Doc) => {
    onClose()
    setQ('')
    nav(d.href)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[8vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="card relative flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={19} className="text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setSel(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSel((s) => Math.min(s + 1, results.length - 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSel((s) => Math.max(s - 1, 0))
                  }
                  if (e.key === 'Enter' && results[sel]) go(results[sel])
                }}
                placeholder="Busca «silencio administrativo», «excedencia», «Consejo Social»…"
                className="h-16 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted/70"
              />
              {!docs && <Loader2 size={18} className="animate-spin text-muted" />}
            </div>
            <div className="thin-scroll overflow-y-auto p-2">
              {terms.length > 0 && docs && results.length === 0 && <p className="p-6 text-center text-sm text-muted">Sin resultados para «{q}».</p>}
              {!terms.length && (
                <div className="p-5 text-sm text-muted">
                  Escribe al menos dos letras. Se busca en el desarrollo de todos los temas, el glosario y la tabla de plazos.
                </div>
              )}
              {results.map((d, i) => {
                const Icon = ICON[d.kind]
                const t = temaById(d.temaId)!
                return (
                  <button
                    key={d.kind + d.href + i}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(d)}
                    className={cn('flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition', i === sel && 'bg-surface-2')}
                  >
                    <Icon size={17} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {KIND[d.kind]} · {temaLabel(t)}
                      </div>
                      <div className="truncate font-semibold">
                        <Highlight text={d.title} terms={terms} />
                      </div>
                      {d.kind !== 'tema' && (
                        <div className="line-clamp-2 text-sm text-muted">
                          <Highlight text={snippet(d.text, terms)} terms={terms} />
                        </div>
                      )}
                    </div>
                    {i === sel && <CornerDownLeft size={15} className="mt-1 text-muted" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
