import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react'
import { useProgress } from '@/store/progress'
import { Button } from './ui'

export function Onboarding() {
  const { onboarded } = useProgress((s) => s.settings)
  const setSettings = useProgress((s) => s.setSettings)
  const [step, setStep] = useState(0)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [meta, setMeta] = useState(120)

  const finish = () => setSettings({ nombre: nombre.trim(), fechaExamen: fecha, metaMinutos: meta, onboarded: true })

  return (
    <AnimatePresence>
      {!onboarded && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-paper/80 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}
            className="card w-full max-w-md overflow-hidden"
          >
            <div className="relative h-36 overflow-hidden bg-primary">
              <motion.div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/15" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
              <motion.div className="absolute -bottom-16 left-6 size-40 rounded-full bg-white/10" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 7, repeat: Infinity }} />
              <div className="relative flex h-full items-end gap-3 p-6 text-white dark:text-[#0d1016]">
                <GraduationCap size={40} />
                <div>
                  <div className="font-display text-2xl font-semibold">Opo ULL</div>
                  <div className="text-sm opacity-85">Escala Administrativa · Universidad de La Laguna</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">¡Hola! Esta es tu web de estudio.</h2>
                    <p className="text-[15px] leading-relaxed text-muted">
                      Tienes aquí los 29 temas desarrollados, esquemas, resúmenes, lectura en voz alta, tests, supuestos prácticos y simulacros con la misma corrección que el examen real. Todo tu progreso se guarda en este dispositivo.
                    </p>
                    <label className="block">
                      <span className="text-sm font-semibold">¿Cómo te llamas?</span>
                      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setStep(1)} placeholder="Tu nombre" className="focus-ring mt-1.5 h-12 w-full rounded-xl border border-line bg-surface-2 px-4 outline-none" />
                    </label>
                    <Button className="w-full" onClick={() => setStep(1)}>
                      Continuar <ArrowRight size={17} />
                    </Button>
                  </motion.div>
                )}
                {step === 1 && (
                  <motion.div key="1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold">Tu objetivo</h2>
                    <label className="block">
                      <span className="text-sm font-semibold">Fecha prevista del primer ejercicio</span>
                      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="focus-ring mt-1.5 h-12 w-full rounded-xl border border-line bg-surface-2 px-4 outline-none" />
                      <span className="mt-1 block text-xs text-muted">Se publicará con la lista definitiva de admitidos. Puedes dejarla en blanco y ponerla después en Ajustes.</span>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">Minutos de estudio al día: {meta}</span>
                      <input type="range" min={30} max={360} step={15} value={meta} onChange={(e) => setMeta(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
                    </label>
                    <Button className="w-full" onClick={finish}>
                      <Sparkles size={17} /> Empezar a estudiar
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
