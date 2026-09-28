import { create } from 'zustand'
import { useProgress } from '@/store/progress'

/**
 * Lector de texto a voz basado en la Web Speech API.
 * - Prioriza voces neuronales en español de España (Edge: "Microsoft Elvira/Álvaro Online (Natural)").
 * - Lee por segmentos (párrafos) troceados en frases para evitar el corte de Chrome a los ~15 s.
 * - Cada segmento puede ir ligado a un elemento del DOM para resaltarlo y seguirlo con el scroll.
 */

export interface Segment {
  text: string
  el?: HTMLElement
}

interface TtsUi {
  active: boolean
  playing: boolean
  index: number
  total: number
  title: string
  source: string
  voices: SpeechSynthesisVoice[]
}

export const useTts = create<TtsUi>(() => ({
  active: false,
  playing: false,
  index: 0,
  total: 0,
  title: '',
  source: '',
  voices: [],
}))

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// Sustituciones para que la lectura suene natural
const REPLACEMENTS: [RegExp, string][] = [
  [/\barts\.\s*/gi, 'artículos '],
  [/\bart\.\s*/gi, 'artículo '],
  [/\bapdo\.\s*/gi, 'apartado '],
  [/\bnúm\.\s*/gi, 'número '],
  [/\bn\.º\s*/gi, 'número '],
  [/\bnº\s*/gi, 'número '],
  [/\bDA\b/g, 'disposición adicional'],
  [/\bDT\b/g, 'disposición transitoria'],
  [/\bDF\b/g, 'disposición final'],
  [/\bRDLeg\b\.?/g, 'Real Decreto Legislativo'],
  [/\bRDL\b/g, 'Real Decreto-ley'],
  [/\bRD\b/g, 'Real Decreto'],
  [/\bLO\b/g, 'Ley Orgánica'],
  [/\bCE\b/g, 'Constitución'],
  [/\bLPAC\b/g, 'la ley de procedimiento'],
  [/\bLRJSP\b/g, 'la ley de régimen jurídico'],
  [/\bLCSP\b/g, 'la ley de contratos'],
  [/\bTREBEP\b/g, 'el estatuto básico'],
  [/\bEBEP\b/g, 'el estatuto básico'],
  [/\bLOSU\b/g, 'la ley del sistema universitario'],
  [/\bLOPDGDD\b/g, 'la ley orgánica de protección de datos'],
  [/\bRGPD\b/g, 'el reglamento general de protección de datos'],
  [/\bLGSS\b/g, 'la ley general de la seguridad social'],
  [/\bLGP\b/g, 'la ley general presupuestaria'],
  [/\bLJCA\b/g, 'la ley de la jurisdicción contencioso-administrativa'],
  [/\bULL\b/g, 'U ele ele'],
  [/\bPTGAS\b/g, 'pe te gas'],
  [/\bPDI\b/g, 'pe de i'],
  [/\bPAS\b/g, 'pas'],
  [/\bAAPP\b/g, 'administraciones públicas'],
  [/\bUE\b/g, 'Unión Europea'],
  [/\bBOE\b/g, 'bo e'],
  [/\bBOC\b/g, 'bo ce'],
  [/\bRPT\b/g, 'relación de puestos de trabajo'],
  [/€/g, ' euros'],
  [/%/g, ' por ciento'],
  [/\bp\. ej\./gi, 'por ejemplo'],
  [/\betc\./gi, 'etcétera'],
  [/\bvs\.?\b/gi, 'frente a'],
  [/→|=>|->/g, ', '],
  [/[•·▪►]/g, ', '],
  [/\s*\/\s*/g, ' barra '],
  [/[*_#>`|]/g, ' '],
]

export function speakable(text: string) {
  let t = text
  for (const [re, rep] of REPLACEMENTS) t = t.replace(re, rep)
  // "1 barra 2015" en referencias legales se lee mejor como "1 de 2015"
  t = t.replace(/(\d+) barra (\d{4})/g, '$1 de $2')
  return t.replace(/\s+/g, ' ').trim()
}

function chunk(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim())
      cur = ''
    }
    if (s.length > max) {
      // trocea por comas si una frase es muy larga
      for (const part of s.split(/(?<=,)\s+/)) {
        if ((cur + part).length > max && cur) {
          out.push(cur.trim())
          cur = ''
        }
        cur += part + ' '
      }
    } else cur += s
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** Puntúa voces: cuanto más alta, más natural y más cercana a es-ES */
export function voiceScore(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase()
  const lang = v.lang.toLowerCase().replace('_', '-')
  if (!lang.startsWith('es')) return -1
  let s = 0
  if (lang === 'es-es') s += 40
  else if (lang.startsWith('es-mx') || lang.startsWith('es-us')) s += 20
  else s += 10
  if (n.includes('natural')) s += 50
  if (n.includes('online')) s += 20
  if (n.includes('neural') || n.includes('enhanced') || n.includes('premium') || n.includes('mejorada')) s += 30
  if (n.includes('google')) s += 25
  if (n.includes('elvira') || n.includes('ximena') || n.includes('dalia')) s += 8
  if (n.includes('alvaro') || n.includes('álvaro')) s += 6
  if (n.includes('mónica') || n.includes('monica') || n.includes('marisol')) s += 5
  if (n.includes('helena') || n.includes('laura') || n.includes('pablo')) s += 2
  return s
}

export function spanishVoices(all: SpeechSynthesisVoice[]) {
  return all.filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a))
}

class Speaker {
  private segments: Segment[] = []
  private chunks: string[] = []
  private chunkIdx = 0
  private token = 0
  private highlighted?: HTMLElement
  onEnd?: () => void

  constructor() {
    if (!ttsSupported) return
    const load = () => useTts.setState({ voices: spanishVoices(speechSynthesis.getVoices()) })
    load()
    speechSynthesis.addEventListener?.('voiceschanged', load)
    // Chrome a veces tarda en poblar las voces
    setTimeout(load, 500)
    setTimeout(load, 2000)
  }

  get voice(): SpeechSynthesisVoice | undefined {
    const { voices } = useTts.getState()
    const uri = useProgress.getState().settings.vozURI
    return voices.find((v) => v.voiceURI === uri) ?? voices[0]
  }

  load(segments: Segment[], opts: { title: string; source: string; start?: number; onEnd?: () => void }) {
    this.stop()
    this.segments = segments.filter((s) => s.text.trim().length > 0)
    this.onEnd = opts.onEnd
    useTts.setState({ active: true, total: this.segments.length, title: opts.title, source: opts.source, index: opts.start ?? 0 })
    this.play(opts.start ?? 0)
  }

  play(index = useTts.getState().index) {
    if (!ttsSupported || !this.segments.length) return
    const i = Math.max(0, Math.min(index, this.segments.length - 1))
    this.token++
    speechSynthesis.cancel()
    useTts.setState({ index: i, playing: true })
    this.chunks = chunk(speakable(this.segments[i].text))
    this.chunkIdx = 0
    this.highlight(this.segments[i].el)
    this.speakChunk(this.token)
  }

  private speakChunk(token: number) {
    if (token !== this.token) return
    const text = this.chunks[this.chunkIdx]
    if (text === undefined) return this.next(true)
    const u = new SpeechSynthesisUtterance(text)
    const v = this.voice
    if (v) {
      u.voice = v
      u.lang = v.lang
    } else u.lang = 'es-ES'
    u.rate = useProgress.getState().settings.velocidad
    u.onend = () => {
      if (token !== this.token) return
      this.chunkIdx++
      this.speakChunk(token)
    }
    u.onerror = (e) => {
      if (token !== this.token || e.error === 'interrupted' || e.error === 'canceled') return
      this.chunkIdx++
      this.speakChunk(token)
    }
    speechSynthesis.speak(u)
  }

  next(auto = false) {
    const { index } = useTts.getState()
    if (index + 1 >= this.segments.length) {
      if (auto) {
        this.stop(false)
        this.onEnd?.()
      }
      return
    }
    this.play(index + 1)
  }

  prev() {
    const { index } = useTts.getState()
    this.play(Math.max(0, index - 1))
  }

  pause() {
    this.token++
    if (ttsSupported) speechSynthesis.cancel()
    useTts.setState({ playing: false })
  }

  toggle() {
    if (useTts.getState().playing) this.pause()
    else this.play()
  }

  /** Reinicia el segmento actual con la nueva voz/velocidad */
  refresh() {
    if (useTts.getState().playing) this.play()
  }

  stop(close = true) {
    this.token++
    if (ttsSupported) speechSynthesis.cancel()
    this.highlight(undefined)
    useTts.setState({ playing: false, ...(close ? { active: false, index: 0, total: 0 } : {}) })
  }

  private highlight(el?: HTMLElement) {
    this.highlighted?.classList.remove('tts-current')
    this.highlighted = el
    if (el) {
      el.classList.add('tts-current')
      const r = el.getBoundingClientRect()
      if (r.top < 90 || r.bottom > window.innerHeight - 140) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  /** Previsualiza una voz */
  sample(v: SpeechSynthesisVoice) {
    if (!ttsSupported) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance('Hola. Así sonará la lectura de tus temas. ¡Mucho ánimo con la oposición!')
    u.voice = v
    u.lang = v.lang
    u.rate = useProgress.getState().settings.velocidad
    speechSynthesis.speak(u)
  }
}

export const speaker = new Speaker()

/** Recoge los bloques legibles de un contenedor renderizado en orden de lectura */
export function segmentsFromContainer(root: HTMLElement): Segment[] {
  const els = root.querySelectorAll<HTMLElement>('h2, h3, h4, p, li, tr, .callout-title')
  const out: Segment[] = []
  els.forEach((el) => {
    // evita duplicar: párrafos dentro de <li> o de callouts ya contados por su padre
    if (el.tagName === 'P' && el.closest('li')) return
    if (el.tagName === 'LI' && el.querySelector('li')) {
      // lee sólo el texto propio del li padre
      const own = Array.from(el.childNodes)
        .filter((n) => !(n instanceof HTMLElement && (n.tagName === 'UL' || n.tagName === 'OL')))
        .map((n) => n.textContent)
        .join(' ')
      out.push({ text: own, el })
      return
    }
    let text = el.innerText
    if (el.tagName === 'TR') text = Array.from(el.children).map((c) => (c as HTMLElement).innerText).join('. ')
    if (/^H[234]$/.test(el.tagName)) text = text + '.'
    out.push({ text, el })
  })
  return out
}
