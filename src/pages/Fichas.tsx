import { useState } from 'react'
import { motion } from 'motion/react'
import { FileDown, Loader2, Clock3, BookCopy, Printer, Download } from 'lucide-react'
import { BLOQUES, TEMAS, temaLabel } from '@/data/temario'
import { hasDatos } from '@/data/content'
import { PageHeader, stagger } from '@/components/ui'
import { downloadAnkiCsv, downloadFichaTema, downloadFichasBloque, downloadFlashcardsPdf, downloadPlazosPdf } from '@/lib/pdf'
import { cn } from '@/lib/cn'

export default function Fichas() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }
  const ids = TEMAS.filter((t) => hasDatos(t.id)).map((t) => t.id)

  return (
    <div>
      <PageHeader
        eyebrow="Para imprimir o llevar en el móvil"
        title="Fichas descargables"
        subtitle="Fichas en PDF generadas a partir del contenido de cada tema: ideas clave, tabla de plazos, reglas mnemotécnicas, resumen y glosario. Ideales para repasar en papel y subrayar."
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Big icon={<BookCopy size={22} />} color="#2f4fd6" title="Todo el temario" text="Las 29 fichas en un único PDF" busy={busy === 'all'} onClick={() => run('all', () => downloadFichasBloque('todos'))} />
        <Big icon={<Clock3 size={22} />} color="#d97706" title="Plazos y cifras" text="Tabla completa de plazos del temario" busy={busy === 'plazos'} onClick={() => run('plazos', downloadPlazosPdf)} />
        <Big icon={<Printer size={22} />} color="#7c3aed" title="Flashcards recortables" text="Imprime a doble cara y recorta" busy={busy === 'flash'} onClick={() => run('flash', () => downloadFlashcardsPdf(ids))} />
        <Big icon={<Download size={22} />} color="#0f9488" title="Flashcards para Anki" text="CSV importable en Anki u otras apps" busy={busy === 'anki'} onClick={() => run('anki', () => downloadAnkiCsv(ids))} />
      </motion.div>

      <div className="mt-10 space-y-8">
        {BLOQUES.map((b) => (
          <section key={b.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold" style={{ color: b.hex }}>Bloque {b.romano} · {b.nombre}</h2>
              <button onClick={() => run(`b${b.id}`, () => downloadFichasBloque(b.id))} className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
                {busy === `b${b.id}` ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} Bloque completo
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TEMAS.filter((t) => t.bloque === b.id).map((t) => {
                const ok = hasDatos(t.id)
                return (
                  <button
                    key={t.id}
                    disabled={!ok || !!busy}
                    onClick={() => run(t.id, () => downloadFichaTema(t.id))}
                    className="card group flex cursor-pointer items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: b.hex }}>
                      {busy === t.id ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-muted">{temaLabel(t)}</span>
                      <span className="block truncate text-sm font-semibold">{t.titulo}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Big({ icon, color, title, text, busy, onClick }: { icon: React.ReactNode; color: string; title: string; text: string; busy: boolean; onClick: () => void }) {
  return (
    <motion.button variants={stagger.item} onClick={onClick} disabled={busy} className={cn('card group flex cursor-pointer flex-col items-start gap-3 p-5 text-left transition hover:-translate-y-1 hover:shadow-xl')}>
      <span className="grid size-12 place-items-center rounded-2xl text-white transition group-hover:scale-110" style={{ background: color }}>
        {busy ? <Loader2 size={22} className="animate-spin" /> : icon}
      </span>
      <span className="font-display text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted">{busy ? 'Generando…' : text}</span>
    </motion.button>
  )
}
