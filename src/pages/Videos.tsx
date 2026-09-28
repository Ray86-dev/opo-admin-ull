import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { loadAllDatos } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { LoadingArticle, PageHeader, Tabs } from '@/components/ui'
import { VideoCard, youtubeSearch } from '@/components/VideoCard'
import { Link } from 'react-router-dom'

export default function Videos() {
  const { data, loading } = useAsync(loadAllDatos, [])
  const [bloque, setBloque] = useState<'1' | '2' | '3' | '4'>('1')
  if (loading) return <LoadingArticle />
  const temas = TEMAS.filter((t) => String(t.bloque) === bloque)
  return (
    <div>
      <PageHeader eyebrow="Aprender de otra forma" title="Vídeos" subtitle="Vídeos de YouTube seleccionados para cada tema. Úsalos para entender lo que más te cueste, no para sustituir el estudio." />
      <Tabs className="mb-8" value={bloque} onChange={setBloque} tabs={BLOQUES.map((b) => ({ id: String(b.id) as '1', label: `${b.romano} · ${b.corto}` }))} />
      <div className="space-y-10">
        {temas.map((t) => {
          const v = data?.[t.id]?.videos ?? []
          return (
            <section key={t.id}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <Link to={`/tema/${t.id}?tab=videos`} className="hover:text-primary">
                  <div className="text-xs font-semibold text-muted">{temaLabel(t)}</div>
                  <h2 className="font-display text-xl font-semibold">{t.titulo}</h2>
                </Link>
                <a href={youtubeSearch(`${t.titulo} oposiciones`)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                  <Search size={14} /> Buscar más <ExternalLink size={12} />
                </a>
              </div>
              {v.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {v.map((x) => <VideoCard key={x.url} {...x} />)}
                </div>
              ) : (
                <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">Sin vídeos seleccionados todavía para este tema.</p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
