// Valida el contenido: JSON correcto, 4 opciones, índice de respuesta válido, supuestos con 15 preguntas.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve('src/content')
let errors = 0
const err = (m) => (errors++, console.error('✗', m))

function checkPreguntas(file, list) {
  list.forEach((p, i) => {
    if (!p.enunciado) err(`${file} #${i}: sin enunciado`)
    if (!Array.isArray(p.opciones) || p.opciones.length !== 4) err(`${file} #${i}: no tiene 4 opciones`)
    if (![0, 1, 2, 3].includes(p.correcta)) err(`${file} #${i}: correcta inválida (${p.correcta})`)
    if (new Set(p.opciones).size !== p.opciones.length) err(`${file} #${i}: opciones repetidas`)
    if (!p.explicacion) err(`${file} #${i}: sin explicación`)
  })
}

let temas = 0, preguntas = 0, flash = 0
for (const id of readdirSync(path.join(root, 'temas'))) {
  const dir = path.join(root, 'temas', id)
  for (const f of ['tema.md', 'resumen.md', 'esquema.md', 'datos.json']) if (!existsSync(path.join(dir, f))) err(`${id}: falta ${f}`)
  const dj = path.join(dir, 'datos.json')
  if (!existsSync(dj)) continue
  try {
    const d = JSON.parse(readFileSync(dj, 'utf8'))
    checkPreguntas(`${id}/datos.json`, d.preguntas ?? [])
    temas++
    preguntas += d.preguntas?.length ?? 0
    flash += d.flashcards?.length ?? 0
  } catch (e) {
    err(`${id}/datos.json: ${e.message}`)
  }
}
let sup = 0, supQ = 0
for (const f of readdirSync(path.join(root, 'supuestos'))) {
  try {
    const s = JSON.parse(readFileSync(path.join(root, 'supuestos', f), 'utf8'))
    if (s.preguntas?.length !== 15) err(`supuestos/${f}: ${s.preguntas?.length} preguntas (deben ser 15)`)
    checkPreguntas(`supuestos/${f}`, s.preguntas ?? [])
    sup++
    supQ += s.preguntas?.length ?? 0
  } catch (e) {
    err(`supuestos/${f}: ${e.message}`)
  }
}
console.log(`${temas} temas · ${preguntas} preguntas · ${flash} flashcards · ${sup} supuestos (${supQ} preguntas)`)
process.exit(errors ? 1 : 0)
