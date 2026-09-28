export const DAY = 86_400_000

export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysUntil(iso: string) {
  if (!iso) return null
  const target = new Date(iso + 'T09:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / DAY)
}

/** Racha de días consecutivos con estudio (hasta hoy o ayer) */
export function streak(diario: Record<string, number>) {
  let n = 0
  const d = new Date()
  if (!diario[todayKey(d)]) d.setDate(d.getDate() - 1)
  while (diario[todayKey(d)] && diario[todayKey(d)] > 0) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export const fmtFecha = (ts: number | string) =>
  new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtDuracion = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export function saludo() {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}
