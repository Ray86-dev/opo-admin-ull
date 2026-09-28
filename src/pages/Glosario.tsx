import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { TEMAS, temaLabel, bloqueById } from '@/data/temario'
import { loadAllDatos } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { LoadingArticle, PageHeader } from '@/components/ui'
import { norm } from '@/components/SearchPalette'

export default function Glosario() {
  const { data, loading } = useAsync(loadAllDatos, [])
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const items = useMemo(() => {
    if (!data) return []
    const all = TEMAS.flatMap((t) => (data[t.id]?.glosario ?? []).map((g) => ({ ...g, tema: t })))
    return all.sort((a, b) => a.termino.localeCompare(b.termino, 'es'))
  }, [data])

  const filtered = useMemo(() => {
    const t = norm(q.trim())
    return t ? items.filter((i) => norm(i.termino + ' ' + i.definicion).includes(t)) : items
  }, [items, q])

  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>()
    filtered.forEach((i) => {
      const L = norm(i.termino[0] ?? '#').toUpperCase()
      if (!m.has(L)) m.set(L, [])
      m.get(L)!.push(i)
    })
    return [...m.entries()]
  }, [filtered])

  if (loading) return <LoadingArticle />

  return (
    <div>
      <PageHeader eyebrow="Vocabulario jurídico" title="Glosario" subtitle={`${items.length} términos definidos a partir de los temas. Dominar el vocabulario te ahorra dudas en las preguntas más literales.`} />
      <div className="sticky top-16 z-20 -mx-4 mb-6 bg-paper/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un término…" className="focus-ring h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] outline-none" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {groups.map(([L]) => (
            <a key={L} href={`#letra-${L}`} onClick={(e) => { e.preventDefault(); document.getElementById(`letra-${L}`)?.scrollIntoView({ behavior: 'smooth' }) }} className="grid size-7 place-items-center rounded-lg text-xs font-bold text-muted hover:bg-surface-2 hover:text-ink">
              {L}
            </a>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {groups.map(([L, list]) => (
          <section key={L} id={`letra-${L}`} className="scroll-mt-40">
            <h2 className="mb-3 font-display text-3xl font-semibold text-primary">{L}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((g, i) => (
                <motion.div key={g.termino + i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{g.termino}</h3>
                    <Link to={`/tema/${g.tema.id}`} className="shrink-0 text-xs font-semibold hover:underline" style={{ color: bloqueById(g.tema.bloque).hex }}>
                      {temaLabel(g.tema)}
                    </Link>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{g.definicion}</p>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
