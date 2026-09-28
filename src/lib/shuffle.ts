export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Baraja las opciones de una pregunta devolviendo el nuevo índice correcto */
export function shuffleOptions<T extends { opciones: string[]; correcta: number }>(q: T): T {
  const idx = shuffle([0, 1, 2, 3])
  return { ...q, opciones: idx.map((i) => q.opciones[i]), correcta: idx.indexOf(q.correcta) }
}

/** Elige n elementos repartidos proporcionalmente entre grupos */
export function sampleProportional<T>(groups: T[][], n: number): T[] {
  const total = groups.reduce((s, g) => s + g.length, 0)
  if (total <= n) return shuffle(groups.flat())
  const picked: T[] = []
  const rest: T[] = []
  for (const g of groups) {
    const s = shuffle(g)
    const k = Math.floor((g.length / total) * n)
    picked.push(...s.slice(0, k))
    rest.push(...s.slice(k))
  }
  return shuffle([...picked, ...shuffle(rest).slice(0, n - picked.length)])
}
