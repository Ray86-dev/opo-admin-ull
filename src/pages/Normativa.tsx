import { motion } from 'motion/react'
import { FileText, ExternalLink } from 'lucide-react'
import { NORMAS, TEMAS, temaLabel } from '@/data/temario'
import { PageHeader, stagger } from '@/components/ui'

const GRUPOS = ['Convocatoria', 'Derecho Administrativo', 'Recursos Humanos', 'Gestión Financiera', 'Gestión Universitaria', 'Universidad de La Laguna']

export default function Normativa() {
  const entries = Object.entries(NORMAS)
  return (
    <div>
      <PageHeader
        eyebrow="Fuentes oficiales"
        title="Normativa"
        subtitle="Los textos oficiales en los que se basa el temario, descargados del BOE (versión consolidada), del BOC y de la web de la ULL. Ante cualquier duda, manda la ley."
      />
      <div className="space-y-8">
        {GRUPOS.map((g) => {
          const list = entries.filter(([, n]) => n.grupo === g)
          if (!list.length) return null
          return (
            <section key={g}>
              <h2 className="mb-3 font-display text-xl font-semibold">{g}</h2>
              <motion.div variants={stagger.container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-3 md:grid-cols-2">
                {list.map(([k, n]) => {
                  const temas = TEMAS.filter((t) => t.normas.includes(k))
                  return (
                    <motion.div key={k} variants={stagger.item} className="card flex items-start gap-4 p-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <FileText size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold leading-snug">{n.nombre}</div>
                        {temas.length > 0 && <div className="mt-1 text-xs text-muted">{temas.map((t) => temaLabel(t).replace('Tema ', '')).join(' · ')}</div>}
                        <div className="mt-2 flex gap-2">
                          <a href={`normativa/${n.archivo}`} target="_blank" rel="noreferrer" className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary hover:brightness-95">
                            Abrir PDF
                          </a>
                          {n.boe && (
                            <a href={n.boe} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted hover:text-ink">
                              Fuente oficial <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </section>
          )
        })}
      </div>
      <p className="mt-10 text-sm text-muted">Textos descargados el 28 de septiembre de 2026. Las leyes se modifican: antes del examen, comprueba en el BOE si hay cambios recientes.</p>
    </div>
  )
}
