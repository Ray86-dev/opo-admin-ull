import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Search, FileDown, Eye, EyeOff, Shuffle } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel, bloqueById } from '@/data/temario'
import { loadAllDatos } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { Button, LoadingArticle, PageHeader, Tabs } from '@/components/ui'
import { norm } from '@/components/SearchPalette'
import { downloadPlazosPdf } from '@/lib/pdf'
import { shuffle } from '@/lib/shuffle'
import { cn } from '@/lib/cn'

export default function Plazos() {
  const { data, loading } = useAsync(loadAllDatos, [])
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [bloque, setBloque] = useState<'0' | '1' | '2' | '3' | '4'>('0')
  const [ocultar, setOcultar] = useState(false)
  const [shown, setShown] = useState<Set<number>>(new Set())
  const [orden, setOrden] = useState<number[] | null>(null)

  const rows = useMemo(() => {
    if (!data) return []
    return TEMAS.flatMap((t) => (data[t.id]?.plazos ?? []).map((p) => ({ ...p, tema: t })))
  }, [data])

  const filtered = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean)
    let list = rows.map((r, i) => ({ ...r, i })).filter((r) => (bloque === '0' || String(r.tema.bloque) === bloque) && terms.every((t) => norm(`${r.concepto} ${r.valor} ${r.ref} ${r.tema.titulo}`).includes(t)))
    if (orden) list = orden.map((i) => list.find((r) => r.i === i)).filter(Boolean) as typeof list
    return list
  }, [rows, q, bloque, orden])

  if (loading) return <LoadingArticle />

  return (
    <div>
      <PageHeader
        eyebrow="Lo que más cae"
        title="Plazos y cifras"
        subtitle={`Todos los plazos, cifras, mayorías y porcentajes del temario en una sola tabla (${rows.length}). Activa el modo «Ponte a prueba» para ocultar los valores y comprobar si te los sabes.`}
      >
        <Button variant="secondary" size="sm" onClick={() => downloadPlazosPdf()}>
          <FileDown size={15} /> Descargar PDF
        </Button>
      </PageHeader>

      <div className="sticky top-16 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 bg-paper/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar: recurso, alzada, excedencia, mayoría absoluta…" className="focus-ring h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] outline-none" />
        </div>
        <Tabs value={bloque} onChange={setBloque} tabs={[{ id: '0', label: 'Todos' }, ...BLOQUES.map((b) => ({ id: String(b.id) as '1', label: b.romano }))]} />
        <Button
          size="sm"
          variant={ocultar ? 'primary' : 'soft'}
          onClick={() => {
            setOcultar((o) => !o)
            setShown(new Set())
          }}
        >
          {ocultar ? <EyeOff size={15} /> : <Eye size={15} />} Ponte a prueba
        </Button>
        {ocultar && (
          <Button size="sm" variant="ghost" onClick={() => { setOrden(shuffle(rows.map((_, i) => i))); setShown(new Set()) }}>
            <Shuffle size={15} /> Mezclar
          </Button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full text-[14.5px]">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-4 py-3">Valor</th>
                <th className="hidden px-4 py-3 md:table-cell">Referencia</th>
                <th className="px-5 py-3">Tema</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const b = bloqueById(r.tema.bloque)
                const visible = !ocultar || shown.has(r.i)
                return (
                  <tr key={r.i} className="border-t border-line transition hover:bg-surface-2/60">
                    <td className="px-5 py-3 leading-snug">{r.concepto}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={!ocultar}
                        onClick={() => setShown((s) => new Set(s).add(r.i))}
                        className={cn('min-w-24 rounded-lg px-2 py-1 text-left font-bold transition', visible ? 'text-amber-700 dark:text-amber-300' : 'cursor-pointer bg-surface-2 text-transparent hover:bg-line')}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span key={String(visible)} initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}>
                            {visible ? r.valor : '· · ·'}
                          </motion.span>
                        </AnimatePresence>
                      </button>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{r.ref}</td>
                    <td className="px-5 py-3">
                      <Link to={`/tema/${r.tema.id}?tab=claves`} className="whitespace-nowrap text-xs font-semibold hover:underline" style={{ color: b.hex }}>
                        {temaLabel(r.tema)}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-muted">No hay resultados.</p>}
      </div>
    </div>
  )
}
