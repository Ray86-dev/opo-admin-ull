import { DAY } from './dates'

/** Repaso espaciado estilo SM-2 simplificado */
export interface SrsCard {
  ease: number
  interval: number // días
  reps: number
  due: number // timestamp
  lapses: number
}

export type Grade = 0 | 1 | 2 | 3 // otra vez · difícil · bien · fácil

export function reviewCard(card: SrsCard | undefined, g: Grade): SrsCard {
  const c: SrsCard = card ?? { ease: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 }
  let { ease, interval, reps, lapses } = c
  if (g === 0) {
    reps = 0
    lapses++
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
    return { ease, interval, reps, lapses, due: Date.now() + 10 * 60_000 }
  }
  if (g === 1) ease = Math.max(1.3, ease - 0.15)
  if (g === 3) ease = ease + 0.15
  reps++
  if (reps === 1) interval = g === 3 ? 4 : g === 2 ? 1 : 0.5
  else if (reps === 2) interval = g === 3 ? 7 : g === 2 ? 3 : 1.5
  else interval = Math.round(interval * (g === 1 ? 1.2 : g === 3 ? ease * 1.3 : ease) * 10) / 10
  return { ease, interval, reps, lapses, due: Date.now() + interval * DAY }
}

export const isDue = (c: SrsCard | undefined) => !c || c.due <= Date.now()

export function nextLabel(card: SrsCard | undefined, g: Grade) {
  const n = reviewCard(card, g)
  if (g === 0) return '10 min'
  const d = n.interval
  if (d < 1) return `${Math.round(d * 24)} h`
  if (d < 30) return `${Math.round(d)} d`
  return `${Math.round(d / 30)} m`
}
