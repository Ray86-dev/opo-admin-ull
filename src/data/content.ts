import { TEMAS } from './temario'

export interface Pregunta {
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  ref: string
  dificultad: 1 | 2 | 3
}

/** Pregunta con identificador estable y origen */
export interface PreguntaId extends Pregunta {
  id: string
  temaId: string
}

export interface Flashcard {
  frente: string
  reverso: string
  ref: string
}

export interface DatosTema {
  claves: string[]
  plazos: { concepto: string; valor: string; ref: string }[]
  glosario: { termino: string; definicion: string }[]
  mnemotecnias: { titulo: string; texto: string }[]
  flashcards: Flashcard[]
  preguntas: Pregunta[]
  videos: { titulo: string; url: string; canal: string }[]
  enlaces: { titulo: string; url: string }[]
}

export interface Supuesto {
  id: string
  bloque: 1 | 2 | 3 | 4
  titulo: string
  temas: string[]
  enunciado: string
  preguntas: Pregunta[]
}

type Loader<T> = () => Promise<T>

const temaMd = import.meta.glob<string>('../content/temas/*/tema.md', { query: '?raw', import: 'default' })
const resumenMd = import.meta.glob<string>('../content/temas/*/resumen.md', { query: '?raw', import: 'default' })
const esquemaMd = import.meta.glob<string>('../content/temas/*/esquema.md', { query: '?raw', import: 'default' })
const datosJson = import.meta.glob<DatosTema>('../content/temas/*/datos.json', { import: 'default' })
const supuestosJson = import.meta.glob<Omit<Supuesto, 'id'>>('../content/supuestos/*.json', { import: 'default' })

const key = (id: string, file: string) => `../content/temas/${id}/${file}`

function pick<T>(map: Record<string, Loader<T>>, path: string): Promise<T | null> {
  const fn = map[path]
  return fn ? fn() : Promise.resolve(null)
}

export const hasTema = (id: string) => key(id, 'tema.md') in temaMd
export const hasDatos = (id: string) => key(id, 'datos.json') in datosJson
export const disponibles = () => TEMAS.filter((t) => hasTema(t.id) || hasDatos(t.id)).map((t) => t.id)

export const loadTema = (id: string) => pick(temaMd, key(id, 'tema.md'))
export const loadResumen = (id: string) => pick(resumenMd, key(id, 'resumen.md'))
export const loadEsquema = (id: string) => pick(esquemaMd, key(id, 'esquema.md'))

const datosCache = new Map<string, Promise<DatosTema | null>>()
export function loadDatos(id: string): Promise<DatosTema | null> {
  if (!datosCache.has(id)) datosCache.set(id, pick(datosJson, key(id, 'datos.json')).then((d) => (d ? normalizeDatos(d) : null)))
  return datosCache.get(id)!
}

function normalizeDatos(d: Partial<DatosTema>): DatosTema {
  return {
    claves: d.claves ?? [],
    plazos: d.plazos ?? [],
    glosario: d.glosario ?? [],
    mnemotecnias: d.mnemotecnias ?? [],
    flashcards: d.flashcards ?? [],
    preguntas: (d.preguntas ?? []).filter((p) => p && Array.isArray(p.opciones) && p.opciones.length === 4),
    videos: (d.videos ?? []).filter((v) => v && /^https?:\/\//.test(v.url)),
    enlaces: d.enlaces ?? [],
  }
}

/** Carga los datos de todos los temas disponibles (para tests globales, glosario, plazos…) */
export async function loadAllDatos(): Promise<Record<string, DatosTema>> {
  const out: Record<string, DatosTema> = {}
  await Promise.all(
    TEMAS.map(async (t) => {
      const d = await loadDatos(t.id)
      if (d) out[t.id] = d
    }),
  )
  return out
}

export async function loadPreguntas(temaIds: string[]): Promise<PreguntaId[]> {
  const all = await Promise.all(
    temaIds.map(async (id) => {
      const d = await loadDatos(id)
      return (d?.preguntas ?? []).map((p, i) => ({ ...p, id: `${id}#${i}`, temaId: id }))
    }),
  )
  return all.flat()
}

export async function loadAllTemaTexts(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(
    TEMAS.map(async (t) => {
      const md = await loadTema(t.id)
      if (md) out[t.id] = md
    }),
  )
  return out
}

let supuestosCache: Promise<Supuesto[]> | null = null
export function loadSupuestos(): Promise<Supuesto[]> {
  supuestosCache ??= Promise.all(
    Object.entries(supuestosJson).map(async ([path, fn]) => {
      const s = await fn()
      const id = path.split('/').pop()!.replace('.json', '')
      return { ...s, id, preguntas: (s.preguntas ?? []).filter((p) => p?.opciones?.length === 4) } as Supuesto
    }),
  ).then((list) => list.sort((a, b) => a.id.localeCompare(b.id, 'es', { numeric: true })))
  return supuestosCache
}

export const supuestoCount = () => Object.keys(supuestosJson).length
