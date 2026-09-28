/** Fórmula de las bases: cada 3 errores restan 1 acierto (o la parte proporcional). */
export function netas(aciertos: number, fallos: number) {
  return aciertos - fallos / 3
}

/** Nota sobre 10 */
export function nota(aciertos: number, fallos: number, total: number) {
  if (!total) return 0
  return Math.max(0, (netas(aciertos, fallos) / total) * 10)
}

export const fmtNota = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function notaColor(n: number) {
  if (n >= 7) return 'text-emerald-600 dark:text-emerald-400'
  if (n >= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}
