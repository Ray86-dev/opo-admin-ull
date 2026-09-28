import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, SkipBack, SkipForward, X, Gauge, Mic2, Check, Volume2 } from 'lucide-react'
import { speaker, useTts, voiceScore } from '@/lib/tts'
import { useProgress } from '@/store/progress'
import { cn } from '@/lib/cn'

const SPEEDS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8]

export function voiceLabel(v: SpeechSynthesisVoice) {
  const clean = v.name.replace(/Microsoft\s*/i, '').replace(/\s*-\s*Spanish.*$/i, '').replace(/Online\s*/i, '').trim()
  const tag = voiceScore(v) >= 90 ? ' ✦ natural' : ''
  return `${clean} (${v.lang})${tag}`
}

export function TtsPlayer() {
  const { active, playing, index, total, title, voices } = useTts()
  const { velocidad, vozURI } = useProgress((s) => s.settings)
  const setSettings = useProgress((s) => s.setSettings)
  const [panel, setPanel] = useState<'none' | 'speed' | 'voice'>('none')
  const current = voices.find((v) => v.voiceURI === vozURI) ?? voices[0]

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
          className="no-print fixed inset-x-3 bottom-[76px] z-50 mx-auto max-w-xl lg:bottom-6 lg:left-64"
        >
          <AnimatePresence>
            {panel !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="card mb-2 max-h-72 overflow-y-auto thin-scroll p-2"
              >
                {panel === 'speed' && (
                  <div className="grid grid-cols-4 gap-1.5 p-1">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSettings({ velocidad: s })
                          setTimeout(() => speaker.refresh(), 0)
                          setPanel('none')
                        }}
                        className={cn('cursor-pointer rounded-xl py-2 text-sm font-semibold transition', s === velocidad ? 'bg-primary text-white dark:text-[#0d1016]' : 'hover:bg-surface-2')}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                )}
                {panel === 'voice' && (
                  <div className="flex flex-col">
                    {voices.length === 0 && <p className="p-3 text-sm text-muted">No hay voces en español en este navegador. Prueba con Microsoft Edge o Chrome.</p>}
                    {voices.map((v) => (
                      <button
                        key={v.voiceURI}
                        onClick={() => {
                          setSettings({ vozURI: v.voiceURI })
                          setTimeout(() => speaker.refresh(), 0)
                          setPanel('none')
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
                      >
                        <span className="w-4">{current?.voiceURI === v.voiceURI && <Check size={15} className="text-primary" />}</span>
                        {voiceLabel(v)}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card flex items-center gap-2 rounded-full py-2 pl-2 pr-3 backdrop-blur-xl">
            <button
              onClick={() => speaker.toggle()}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              className="focus-ring relative grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-white transition active:scale-95 dark:text-[#0d1016]"
            >
              {playing && <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />}
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="min-w-0 flex-1 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Volume2 size={12} /> Escuchando
              </div>
              <div className="truncate text-sm font-semibold">{title}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                <motion.div className="h-full bg-primary" animate={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }} />
              </div>
            </div>
            <button aria-label="Anterior" onClick={() => speaker.prev()} className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <SkipBack size={17} />
            </button>
            <button aria-label="Siguiente" onClick={() => speaker.next()} className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <SkipForward size={17} />
            </button>
            <button
              aria-label="Velocidad"
              onClick={() => setPanel(panel === 'speed' ? 'none' : 'speed')}
              className="flex h-9 cursor-pointer items-center gap-1 rounded-full px-1.5 text-xs font-bold text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Gauge size={15} className="hidden sm:block" />
              {velocidad}×
            </button>
            <button aria-label="Voz" onClick={() => setPanel(panel === 'voice' ? 'none' : 'voice')} className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <Mic2 size={17} />
            </button>
            <button
              aria-label="Cerrar lector"
              onClick={() => {
                speaker.stop()
                setPanel('none')
              }}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
