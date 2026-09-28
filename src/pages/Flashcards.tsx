import { useMemo, useState } from 'react'
import { Download, FileDown } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { loadAllDatos } from '@/data/content'
import { useAsync } from '@/lib/useAsync'
import { useProgress } from '@/store/progress'
import { isDue } from '@/lib/srs'
import { FlashcardDeck, type DeckCard } from '@/components/FlashcardDeck'
import { Button, Empty, LoadingArticle, PageHeader } from '@/components/ui'
import { downloadAnkiCsv, downloadFlashcardsPdf } from '@/lib/pdf'
import { cn } from '@/lib/cn'

export default function Flashcards() {
  const { data, loading } = useAsync(loadAllDatos, [])
  const srs = useProgress((s) => s.srs)
  const [bloque, setBloque] = useState<number | 0>(0)
  const [tema, setTema] = useState<string>('')

  const all = useMemo<DeckCard[]>(
    () => (data ? Object.entries(data).flatMap(([id, d]) => d.flashcards.map((f, i) => ({ ...f, id: `${id}~${i}`, temaId: id }))) : []),
    [data],
  )
  const cards = useMemo(() => all.filter((c) => (tema ? c.temaId === tema : bloque ? c.temaId.startsWith(`${bloque}-`) : true)), [all, bloque, tema])
  const temaIds = useMemo(() => [...new Set(cards.map((c) => c.temaId))], [cards])

  if (loading) return <LoadingArticle />

  return (
    <div>
      <PageHeader
        eyebrow="Memoria a largo plazo"
        title="Flashcards"
        subtitle="Repaso espaciado: las tarjetas que te cuestan vuelven pronto y las que dominas se espacian cada vez más. Con 10–15 minutos al día llegas al examen con todo fresco."
      >
        <Button variant="secondary" size="sm" onClick={() => downloadFlashcardsPdf(temaIds)} disabled={!cards.length}>
          <FileDown size={15} /> PDF recortable
        </Button>
        <Button variant="ghost" size="sm" onClick={() => downloadAnkiCsv(temaIds)} disabled={!cards.length}>
          <Download size={15} /> Exportar a Anki
        </Button>
      </PageHeader>

      {!all.length ? (
        <Empty title="Aún no hay flashcards">Se están generando con el contenido de cada tema.</Empty>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip on={!bloque && !tema} onClick={() => { setBloque(0); setTema('') }}>
              Todo ({all.filter((c) => isDue(srs[c.id])).length} para hoy)
            </Chip>
            {BLOQUES.map((b) => (
              <Chip key={b.id} on={bloque === b.id && !tema} color={b.hex} onClick={() => { setBloque(b.id); setTema('') }}>
                Bloque {b.romano}
              </Chip>
            ))}
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="focus-ring h-9 w-full max-w-full rounded-full border border-line bg-surface px-3 text-sm font-semibold sm:w-auto sm:max-w-xs"
            >
              <option value="">Un tema concreto…</option>
              {TEMAS.filter((t) => all.some((c) => c.temaId === t.id)).map((t) => (
                <option key={t.id} value={t.id}>{temaLabel(t)} · {t.titulo}</option>
              ))}
            </select>
          </div>
          <FlashcardDeck key={`${bloque}-${tema}`} cards={cards} />
        </>
      )}
    </div>
  )
}

function Chip({ on, color, onClick, children }: { on: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition', on ? 'text-white dark:text-[#0d1016]' : 'border border-line bg-surface text-muted hover:text-ink')}
      style={on ? { background: color ?? 'var(--primary)' } : undefined}
    >
      {children}
    </button>
  )
}
