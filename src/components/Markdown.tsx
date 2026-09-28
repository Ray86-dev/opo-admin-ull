import { memo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { AlertTriangle, Clock, Lightbulb, Info, GraduationCap, StickyNote } from 'lucide-react'
import { cn } from '@/lib/cn'

export const CALLOUTS: Record<string, { label: string; icon: typeof Info }> = {
  examen: { label: 'Ojo, que cae en el examen', icon: AlertTriangle },
  plazo: { label: 'Plazos y cifras', icon: Clock },
  truco: { label: 'Truco para recordarlo', icon: Lightbulb },
  importante: { label: 'Importante', icon: Info },
  ull: { label: 'Universidad de La Laguna', icon: GraduationCap },
  nota: { label: 'Nota', icon: StickyNote },
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Convierte `> [!TIPO] texto` en un callout */
function remarkCallouts() {
  return (tree: any) => {
    visit(tree, 'blockquote', (node: any) => {
      const first = node.children?.[0]
      const text = first?.type === 'paragraph' ? first.children?.[0] : null
      if (!text || text.type !== 'text') return
      const m = /^\s*\[!([A-ZÁÉÍÓÚ]+)\]\s*/i.exec(text.value)
      if (!m) return
      const tipo = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      text.value = text.value.slice(m[0].length)
      if (!text.value && first.children.length > 1 && first.children[1].type === 'break') first.children.splice(0, 2)
      node.data = { hName: 'aside', hProperties: { className: ['callout', `callout-${CALLOUTS[tipo] ? tipo : 'nota'}`], 'data-callout': tipo } }
    })
  }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

function textOf(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textOf).join('')
  if (children && typeof children === 'object' && 'props' in children) return textOf((children as any).props.children)
  return ''
}

const components: Components = {
  h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
  table: ({ children }) => (
    <div className="table-wrap thin-scroll">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  aside: ({ node, children, ...props }: any) => {
    const tipo = props['data-callout'] as string
    const c = CALLOUTS[tipo] ?? CALLOUTS.nota
    const Icon = c.icon
    return (
      <aside className={cn(props.className)}>
        <div className="callout-title">
          <Icon size={15} strokeWidth={2.4} /> {c.label}
        </div>
        {children}
      </aside>
    )
  },
}

export const Markdown = memo(function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallouts]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
})

/** Extrae el índice (h2/h3) de un markdown */
export function tocOf(md: string) {
  return md
    .split('\n')
    .map((l) => /^(##|###)\s+(.+)$/.exec(l))
    .filter(Boolean)
    .map((m) => {
      const text = m![2].replace(/[*_`]/g, '').trim()
      return { level: m![1].length, text, id: slugify(text) }
    })
}

export const wordCount = (md: string) => md.split(/\s+/).filter(Boolean).length
