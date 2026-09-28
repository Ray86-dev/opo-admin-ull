import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey } from '@/lib/dates'
import { reviewCard, type SrsCard, type Grade } from '@/lib/srs'

export type EstadoTema = 'pendiente' | 'estudiando' | 'estudiado' | 'dominado'

export interface TemaProgress {
  estado: EstadoTema
  /** % de lectura del desarrollo completo (0-100) */
  leido: number
  /** posición de scroll relativa (0-1) para continuar */
  scroll: number
  vueltas: number
  ultimo?: number
  notas: string
}

export interface QStat {
  vistas: number
  aciertos: number
  fallos: number
  ultima: number
  /** última respuesta: true acierto, false fallo */
  ok: boolean
}

export interface TestRecord {
  id: string
  fecha: number
  tipo: 'test' | 'simulacro1' | 'simulacro2' | 'supuesto' | 'repaso'
  titulo: string
  temas: string[]
  total: number
  aciertos: number
  fallos: number
  blancos: number
  nota: number
  segundos: number
  detalle?: { nombre: string; nota: number }[]
}

export interface Settings {
  nombre: string
  fechaExamen: string
  metaMinutos: number
  tema: 'claro' | 'oscuro' | 'sistema'
  fuenteLectura: 'serif' | 'sans'
  tamLectura: number
  vozURI: string
  velocidad: number
  onboarded: boolean
  /** lunes desde el que se calcula el plan de estudio (timestamp) */
  planInicio?: number
}

interface State {
  settings: Settings
  temas: Record<string, TemaProgress>
  qstats: Record<string, QStat>
  favoritas: Record<string, true>
  srs: Record<string, SrsCard>
  historial: TestRecord[]
  /** minutos de estudio por día (YYYY-MM-DD) */
  diario: Record<string, number>
  planHecho: Record<string, true>

  setSettings: (s: Partial<Settings>) => void
  updateTema: (id: string, p: Partial<TemaProgress>) => void
  answer: (qid: string, ok: boolean) => void
  toggleFav: (qid: string) => void
  gradeCard: (cid: string, g: Grade) => void
  addRecord: (r: TestRecord) => void
  addMinutes: (m: number) => void
  togglePlan: (k: string) => void
  importState: (data: unknown) => void
  reset: () => void
}

const defaultSettings: Settings = {
  nombre: '',
  fechaExamen: '',
  metaMinutos: 120,
  tema: 'sistema',
  fuenteLectura: 'serif',
  tamLectura: 19,
  vozURI: '',
  velocidad: 1,
  onboarded: false,
}

export const emptyTema = (): TemaProgress => ({ estado: 'pendiente', leido: 0, scroll: 0, vueltas: 0, notas: '' })

const initial = {
  settings: defaultSettings,
  temas: {} as Record<string, TemaProgress>,
  qstats: {} as Record<string, QStat>,
  favoritas: {} as Record<string, true>,
  srs: {} as Record<string, SrsCard>,
  historial: [] as TestRecord[],
  diario: {} as Record<string, number>,
  planHecho: {} as Record<string, true>,
}

export const useProgress = create<State>()(
  persist(
    (set) => ({
      ...initial,
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      updateTema: (id, p) =>
        set((st) => ({ temas: { ...st.temas, [id]: { ...emptyTema(), ...st.temas[id], ...p, ultimo: Date.now() } } })),
      answer: (qid, ok) =>
        set((st) => {
          const prev = st.qstats[qid] ?? { vistas: 0, aciertos: 0, fallos: 0, ultima: 0, ok }
          return {
            qstats: {
              ...st.qstats,
              [qid]: { vistas: prev.vistas + 1, aciertos: prev.aciertos + (ok ? 1 : 0), fallos: prev.fallos + (ok ? 0 : 1), ultima: Date.now(), ok },
            },
          }
        }),
      toggleFav: (qid) =>
        set((st) => {
          const f = { ...st.favoritas }
          if (f[qid]) delete f[qid]
          else f[qid] = true
          return { favoritas: f }
        }),
      gradeCard: (cid, g) => set((st) => ({ srs: { ...st.srs, [cid]: reviewCard(st.srs[cid], g) } })),
      addRecord: (r) => set((st) => ({ historial: [r, ...st.historial].slice(0, 500) })),
      addMinutes: (m) =>
        set((st) => {
          const k = todayKey()
          return { diario: { ...st.diario, [k]: Math.round(((st.diario[k] ?? 0) + m) * 100) / 100 } }
        }),
      togglePlan: (k) =>
        set((st) => {
          const p = { ...st.planHecho }
          if (p[k]) delete p[k]
          else p[k] = true
          return { planHecho: p }
        }),
      importState: (data) =>
        set(() => {
          const d = data as Partial<typeof initial>
          return { ...initial, ...d, settings: { ...defaultSettings, ...(d.settings ?? {}) } }
        }),
      reset: () => set({ ...initial, settings: { ...defaultSettings, onboarded: true } }),
    }),
    { name: 'opo-ull-progress', version: 1 },
  ),
)

export function exportState() {
  const s = useProgress.getState()
  const { settings, temas, qstats, favoritas, srs, historial, diario, planHecho } = s
  return { settings, temas, qstats, favoritas, srs, historial, diario, planHecho, exportado: new Date().toISOString() }
}
