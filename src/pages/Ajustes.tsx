import { useRef, useState } from 'react'
import { Download, Upload, Trash2, Volume2, Smartphone, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useProgress, exportState } from '@/store/progress'
import { speaker, useTts, ttsSupported, voiceScore } from '@/lib/tts'
import { voiceLabel } from '@/components/TtsPlayer'
import { Button, Modal, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'

export default function Ajustes() {
  const { settings, setSettings, importState, reset } = useProgress()
  const voices = useTts((s) => s.voices)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const current = voices.find((v) => v.voiceURI === settings.vozURI) ?? voices[0]
  const hasNatural = voices.some((v) => voiceScore(v) >= 90)

  const exportar = () => {
    const blob = new Blob([JSON.stringify(exportState(), null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `opo-ull-progreso-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 3000)
  }

  const importar = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!data || typeof data !== 'object' || !('settings' in data)) throw new Error('formato')
      importState(data)
      setMsg('Progreso restaurado correctamente.')
    } catch {
      setMsg('Ese archivo no es una copia de seguridad válida.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Personaliza" title="Ajustes" />
      <div className="space-y-6">
        <Section title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <input value={settings.nombre} onChange={(e) => setSettings({ nombre: e.target.value })} className="input" />
            </Field>
            <Field label="Fecha del primer ejercicio">
              <input type="date" value={settings.fechaExamen} onChange={(e) => setSettings({ fechaExamen: e.target.value })} className="input" />
            </Field>
            <Field label={`Objetivo diario: ${settings.metaMinutos} minutos`}>
              <input type="range" min={30} max={480} step={15} value={settings.metaMinutos} onChange={(e) => setSettings({ metaMinutos: +e.target.value })} className="mt-3 w-full accent-[var(--primary)]" />
            </Field>
          </div>
        </Section>

        <Section title="Apariencia">
          <div className="grid grid-cols-3 gap-2">
            {([
              ['claro', 'Claro', Sun],
              ['oscuro', 'Oscuro', Moon],
              ['sistema', 'Automático', Monitor],
            ] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setSettings({ tema: id })} className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-semibold transition', settings.tema === id ? 'border-primary bg-primary-soft' : 'border-line hover:border-primary/40')}>
                <Icon size={20} /> {label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Letra de lectura">
              <div className="grid grid-cols-2 gap-2">
                {(['serif', 'sans'] as const).map((f) => (
                  <button key={f} onClick={() => setSettings({ fuenteLectura: f })} className={cn('h-11 cursor-pointer rounded-xl border-2 text-[15px] transition', f === 'serif' ? 'font-serif' : 'font-sans', settings.fuenteLectura === f ? 'border-primary bg-primary-soft' : 'border-line')}>
                    {f === 'serif' ? 'Literata' : 'Inter'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Tamaño de lectura: ${settings.tamLectura} px`}>
              <input type="range" min={15} max={26} value={settings.tamLectura} onChange={(e) => setSettings({ tamLectura: +e.target.value })} className="mt-3 w-full accent-[var(--primary)]" />
            </Field>
          </div>
        </Section>

        <Section title="Lectura en voz alta">
          {!ttsSupported ? (
            <p className="text-sm text-muted">Este navegador no permite la lectura en voz alta.</p>
          ) : (
            <>
              {!hasNatural && (
                <p className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  Para la voz más natural usa <b>Microsoft Edge</b> (en Windows, Mac o Android): incluye las voces neuronales «Elvira» y «Álvaro» en español de España, gratis y sin instalar nada. En Chrome, la mejor es «Google español».
                </p>
              )}
              <Field label={`Velocidad: ${settings.velocidad}×`}>
                <input type="range" min={0.7} max={2} step={0.05} value={settings.velocidad} onChange={(e) => setSettings({ velocidad: +e.target.value })} className="mt-3 w-full accent-[var(--primary)]" />
              </Field>
              <div className="mt-4 max-h-80 space-y-1 overflow-y-auto thin-scroll">
                {voices.map((v) => (
                  <div key={v.voiceURI} className={cn('flex items-center gap-3 rounded-xl px-3 py-2', current?.voiceURI === v.voiceURI ? 'bg-primary-soft' : 'hover:bg-surface-2')}>
                    <button onClick={() => setSettings({ vozURI: v.voiceURI })} className="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm">
                      <span className="w-4">{current?.voiceURI === v.voiceURI && <Check size={15} className="text-primary" />}</span>
                      {voiceLabel(v)}
                    </button>
                    <button onClick={() => speaker.sample(v)} className="grid size-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label="Probar voz">
                      <Volume2 size={15} />
                    </button>
                  </div>
                ))}
                {voices.length === 0 && <p className="text-sm text-muted">Cargando voces…</p>}
              </div>
            </>
          )}
        </Section>

        <Section title="Copia de seguridad">
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Tu progreso (temas, respuestas, flashcards, notas e historial) se guarda en este navegador. Descarga una copia de vez en cuando o para pasarla a otro dispositivo (del ordenador al móvil, por ejemplo).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportar}>
              <Download size={16} /> Descargar copia
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Restaurar copia
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
            <Button variant="ghost" className="ml-auto text-rose-600" onClick={() => setConfirm(true)}>
              <Trash2 size={16} /> Borrar progreso
            </Button>
          </div>
          {msg && <p className="mt-3 text-sm font-semibold">{msg}</p>}
        </Section>

        <Section title="Instalar en el móvil">
          <div className="flex gap-3 text-sm leading-relaxed text-muted">
            <Smartphone size={20} className="mt-0.5 shrink-0 text-primary" />
            <p>
              Abre esta web en el móvil y elige <b className="text-ink">«Añadir a pantalla de inicio»</b> (en Safari, botón Compartir; en Chrome o Edge, menú ⋮). Se abrirá como una app, a pantalla completa, y funciona sin conexión una vez cargada.
            </p>
          </div>
        </Section>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="¿Borrar todo el progreso?">
        <p className="text-[15px] text-muted">Se borrarán tus estadísticas, historial, flashcards y notas de este dispositivo. No se puede deshacer, así que descarga antes una copia si quieres conservarlo.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={() => {
              reset()
              setConfirm(false)
              setMsg('Progreso borrado.')
            }}
          >
            Borrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  )
}
