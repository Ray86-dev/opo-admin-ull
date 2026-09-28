import type { ReactNode } from 'react'
import { TEMAS, temaById, temaLabel, bloqueById, type Tema } from '@/data/temario'
import { loadDatos, loadResumen, type DatosTema } from '@/data/content'

/** Helvetica (WinAnsi) no tiene ciertos glifos: los sustituimos */
function clean(s: string) {
  return s
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[→⇒➜]/g, '->')
    .replace(/[←]/g, '<-')
    .replace(/[✓✔]/g, 'Sí')
    .replace(/[✗✘]/g, 'No')
    .replace(/≈/g, '~')
    .replace(/[‑‐]/g, '-')
    .replace(/ /g, ' ')
    .replace(/[^\u0000-ÿ€“”‘’–—•…]/g, '')
}

type PdfMod = typeof import('@react-pdf/renderer')

async function lib() {
  return import('@react-pdf/renderer')
}

function makeStyles(P: PdfMod, color: string) {
  return P.StyleSheet.create({
    page: { paddingTop: 42, paddingBottom: 48, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.45, color: '#1a1e29' },
    band: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: color },
    eyebrow: { fontSize: 8.5, color, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
    title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 6, lineHeight: 1.2 },
    epigrafe: { fontSize: 8.5, color: '#5f6677', marginBottom: 14 },
    h2: { fontSize: 12.5, fontFamily: 'Helvetica-Bold', color, marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#e5dfd3' },
    h3: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 3 },
    p: { marginBottom: 5 },
    li: { flexDirection: 'row', marginBottom: 3 },
    bullet: { width: 12, color },
    liText: { flex: 1 },
    callout: { borderLeftWidth: 3, borderLeftColor: color, backgroundColor: '#f6f3ed', padding: 7, marginVertical: 5, borderRadius: 3 },
    calloutTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color, marginBottom: 2, textTransform: 'uppercase' },
    row: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: '#e5dfd3', paddingVertical: 4 },
    th: { fontFamily: 'Helvetica-Bold', backgroundColor: '#f1ece3' },
    cell: { flex: 1, paddingHorizontal: 4, fontSize: 8.8 },
    clave: { flexDirection: 'row', marginBottom: 4 },
    num: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: color, marginRight: 7, marginTop: 0.5, alignItems: 'center', justifyContent: 'center' },
    numText: { color: 'white', fontSize: 7.5, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
    footer: { position: 'absolute', bottom: 22, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: '#9aa1b3' },
    bold: { fontFamily: 'Helvetica-Bold' },
    mnemo: { backgroundColor: '#f3effd', borderRadius: 4, padding: 7, marginBottom: 5 },
  })
}

type Styles = ReturnType<typeof makeStyles>

/** **negrita** en línea */
function inline(P: PdfMod, s: Styles, text: string): ReactNode[] {
  const parts = clean(text).replace(/`/g, '').split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <P.Text key={i} style={s.bold}>{p.slice(2, -2)}</P.Text>
    ) : (
      p.replace(/\*([^*]+)\*/g, '$1')
    ),
  )
}

const CALLOUT_LABEL: Record<string, string> = { examen: 'Ojo examen', plazo: 'Plazos', truco: 'Truco', importante: 'Importante', ull: 'ULL', nota: 'Nota' }

/** Markdown sencillo -> elementos react-pdf */
function mdToPdf(P: PdfMod, s: Styles, md: string): ReactNode[] {
  const out: ReactNode[] = []
  const lines = md.split('\n')
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const h = /^(#{1,4})\s+(.*)/.exec(line)
    if (h) {
      out.push(<P.Text key={k++} style={h[1].length <= 2 ? s.h2 : s.h3} minPresenceAhead={40}>{inline(P, s, h[2])}</P.Text>)
      i++
      continue
    }
    if (line.startsWith('>')) {
      const block: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) block.push(lines[i++].replace(/^>\s?/, ''))
      const m = /^\[!(\w+)\]\s*/.exec(block[0] ?? '')
      if (m) block[0] = block[0].slice(m[0].length)
      out.push(
        <P.View key={k++} style={s.callout} wrap={false}>
          {m && <P.Text style={s.calloutTitle}>{CALLOUT_LABEL[m[1].toLowerCase()] ?? m[1]}</P.Text>}
          <P.Text>{inline(P, s, block.filter(Boolean).join(' '))}</P.Text>
        </P.View>,
      )
      continue
    }
    if (line.trim().startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i++].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r)
      }
      out.push(
        <P.View key={k++} style={{ marginVertical: 5, borderTopWidth: 0.6, borderTopColor: '#e5dfd3' }}>
          {rows.map((r, ri) => (
            <P.View key={ri} style={[s.row, ri === 0 ? s.th : {}]} wrap={false}>
              {r.map((c, ci) => <P.Text key={ci} style={s.cell}>{inline(P, s, c)}</P.Text>)}
            </P.View>
          ))}
        </P.View>,
      )
      continue
    }
    const li = /^(\s*)([-*]|\d+[.)])\s+(.*)/.exec(line)
    if (li) {
      const depth = Math.floor(li[1].length / 2)
      out.push(
        <P.View key={k++} style={[s.li, { marginLeft: depth * 12 }]}>
          <P.Text style={s.bullet}>{/\d/.test(li[2]) ? li[2] : '•'}</P.Text>
          <P.Text style={s.liText}>{inline(P, s, li[3])}</P.Text>
        </P.View>,
      )
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#|>|\s*[-*]\s|\s*\d+[.)]\s|\|)/.test(lines[i])) para.push(lines[i++])
    if (para.length) out.push(<P.Text key={k++} style={s.p}>{inline(P, s, para.join(' '))}</P.Text>)
    else i++
  }
  return out
}

function FichaPages(P: PdfMod, tema: Tema, datos: DatosTema | null, resumen: string | null) {
  const b = bloqueById(tema.bloque)
  const s = makeStyles(P, b.hex)
  return [
    <P.Page key={tema.id} size="A4" style={s.page}>
      <P.View style={s.band} fixed />
      <P.Text style={s.eyebrow}>{clean(`Bloque ${b.romano} · ${b.nombre} · ${temaLabel(tema)}`)}</P.Text>
      <P.Text style={s.title}>{clean(tema.titulo)}</P.Text>
      <P.Text style={s.epigrafe}>{clean(tema.epigrafe)}</P.Text>

      {datos && datos.claves.length > 0 && (
        <P.View>
          <P.Text style={s.h2}>Ideas clave</P.Text>
          {datos.claves.map((c, i) => (
            <P.View key={i} style={s.clave} wrap={false}>
              <P.View style={s.num}><P.Text style={s.numText}>{i + 1}</P.Text></P.View>
              <P.Text style={{ flex: 1 }}>{inline(P, s, c)}</P.Text>
            </P.View>
          ))}
        </P.View>
      )}

      {datos && datos.plazos.length > 0 && (
        <P.View>
          <P.Text style={s.h2} minPresenceAhead={60}>Plazos, cifras y porcentajes</P.Text>
          <P.View style={[s.row, s.th]}>
            <P.Text style={[s.cell, { flex: 2.2 }]}>Concepto</P.Text>
            <P.Text style={s.cell}>Valor</P.Text>
            <P.Text style={s.cell}>Referencia</P.Text>
          </P.View>
          {datos.plazos.map((p, i) => (
            <P.View key={i} style={s.row} wrap={false}>
              <P.Text style={[s.cell, { flex: 2.2 }]}>{clean(p.concepto)}</P.Text>
              <P.Text style={[s.cell, s.bold]}>{clean(p.valor)}</P.Text>
              <P.Text style={[s.cell, { color: '#5f6677' }]}>{clean(p.ref)}</P.Text>
            </P.View>
          ))}
        </P.View>
      )}

      {datos && datos.mnemotecnias.length > 0 && (
        <P.View>
          <P.Text style={s.h2} minPresenceAhead={40}>Reglas mnemotécnicas</P.Text>
          {datos.mnemotecnias.map((m, i) => (
            <P.View key={i} style={s.mnemo} wrap={false}>
              <P.Text style={s.bold}>{clean(m.titulo)}</P.Text>
              <P.Text>{clean(m.texto)}</P.Text>
            </P.View>
          ))}
        </P.View>
      )}

      <P.View style={s.footer} fixed>
        <P.Text>{clean(`Opo ULL · Escala Administrativa C1 · ${temaLabel(tema)}`)}</P.Text>
        <P.Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </P.View>
    </P.Page>,
    <P.Page key={`${tema.id}-r`} size="A4" style={s.page}>
      <P.View style={s.band} fixed />
      {resumen && (
        <P.View>
          <P.Text style={[s.h2, { fontSize: 14, marginTop: 0 }]}>{clean(`Resumen · ${temaLabel(tema)}`)}</P.Text>
          {mdToPdf(P, s, resumen)}
        </P.View>
      )}

      {datos && datos.glosario.length > 0 && (
        <P.View>
          <P.Text style={s.h2} minPresenceAhead={40}>Glosario</P.Text>
          {datos.glosario.map((g, i) => (
            <P.Text key={i} style={s.p}>
              <P.Text style={s.bold}>{clean(g.termino)}: </P.Text>
              {clean(g.definicion)}
            </P.Text>
          ))}
        </P.View>
      )}

      <P.View style={s.footer} fixed>
        <P.Text>{clean(`Opo ULL · Escala Administrativa C1 · ${temaLabel(tema)}`)}</P.Text>
        <P.Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </P.View>
    </P.Page>,
  ]
}

async function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function downloadFichaTema(id: string) {
  const tema = temaById(id)!
  const [P, datos, resumen] = await Promise.all([lib(), loadDatos(id), loadResumen(id)])
  const doc = <P.Document title={`Ficha ${temaLabel(tema)} - ${tema.titulo}`} author="Opo ULL">{FichaPages(P, tema, datos, resumen)}</P.Document>
  const blob = await P.pdf(doc).toBlob()
  await save(blob, `Ficha_${tema.id}_${tema.titulo.replace(/[^\wáéíóúñ]+/gi, '_').slice(0, 50)}.pdf`)
}

export async function downloadFichasBloque(bloque: number | 'todos') {
  const temas = TEMAS.filter((t) => bloque === 'todos' || t.bloque === bloque)
  const P = await lib()
  const data = await Promise.all(temas.map(async (t) => [t, await loadDatos(t.id), await loadResumen(t.id)] as const))
  const doc = <P.Document title="Fichas de estudio" author="Opo ULL">{data.map(([t, d, r]) => FichaPages(P, t, d, r))}</P.Document>
  const blob = await P.pdf(doc).toBlob()
  await save(blob, bloque === 'todos' ? 'Fichas_todo_el_temario.pdf' : `Fichas_Bloque_${bloqueById(bloque).romano}.pdf`)
}

/** Tarjetas recortables: página de preguntas y página de respuestas en espejo (imprimir a doble cara, borde largo) */
export async function downloadFlashcardsPdf(temaIds: string[]) {
  const P = await lib()
  const cards: { f: string; r: string; t: string; color: string }[] = []
  for (const id of temaIds) {
    const d = await loadDatos(id)
    const t = temaById(id)!
    d?.flashcards.forEach((c) => cards.push({ f: c.frente, r: c.reverso + (c.ref ? `  (${c.ref})` : ''), t: temaLabel(t), color: bloqueById(t.bloque).hex }))
  }
  const per = 8
  const pages: (typeof cards)[] = []
  for (let i = 0; i < cards.length; i += per) pages.push(cards.slice(i, i + per))
  const cardStyle = { width: '50%', height: '25%', padding: 12, borderWidth: 0.5, borderColor: '#c9c2b4', borderStyle: 'dashed' as const, justifyContent: 'center' as const }
  const doc = (
    <P.Document title="Flashcards recortables" author="Opo ULL">
      {pages.flatMap((pg, pi) => {
        const mirrored: (typeof cards[number] | null)[] = []
        for (let r = 0; r < 4; r++) {
          mirrored.push(pg[r * 2 + 1] ?? null, pg[r * 2] ?? null)
        }
        return [
          <P.Page key={`f${pi}`} size="A4" style={{ flexDirection: 'row', flexWrap: 'wrap', fontFamily: 'Helvetica', padding: 20 }}>
            {Array.from({ length: per }).map((_, i) => {
              const c = pg[i]
              return (
                <P.View key={i} style={cardStyle}>
                  {c && <P.Text style={{ fontSize: 7, color: c.color, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>{clean(c.t)}</P.Text>}
                  {c && <P.Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', lineHeight: 1.35 }}>{clean(c.f)}</P.Text>}
                </P.View>
              )
            })}
          </P.Page>,
          <P.Page key={`b${pi}`} size="A4" style={{ flexDirection: 'row', flexWrap: 'wrap', fontFamily: 'Helvetica', padding: 20 }}>
            {mirrored.map((c, i) => (
              <P.View key={i} style={cardStyle}>
                {c && <P.Text style={{ fontSize: 9.5, lineHeight: 1.4 }}>{clean(c.r)}</P.Text>}
              </P.View>
            ))}
          </P.Page>,
        ]
      })}
    </P.Document>
  )
  const blob = await P.pdf(doc).toBlob()
  await save(blob, 'Flashcards_recortables.pdf')
}

/** Tabla de todos los plazos del temario */
export async function downloadPlazosPdf() {
  const P = await lib()
  const s = makeStyles(P, '#d97706')
  const data = await Promise.all(TEMAS.map(async (t) => [t, await loadDatos(t.id)] as const))
  const doc = (
    <P.Document title="Plazos y cifras del temario" author="Opo ULL">
      <P.Page size="A4" style={s.page}>
        <P.View style={s.band} fixed />
        <P.Text style={s.eyebrow}>Escala Administrativa ULL</P.Text>
        <P.Text style={s.title}>Plazos, cifras y porcentajes de todo el temario</P.Text>
        {data.filter(([, d]) => d && d.plazos.length).map(([t, d]) => (
          <P.View key={t.id}>
            <P.Text style={s.h2} minPresenceAhead={50}>{clean(`${temaLabel(t)} · ${t.titulo}`)}</P.Text>
            {d!.plazos.map((p, i) => (
              <P.View key={i} style={s.row} wrap={false}>
                <P.Text style={[s.cell, { flex: 2.4 }]}>{clean(p.concepto)}</P.Text>
                <P.Text style={[s.cell, s.bold]}>{clean(p.valor)}</P.Text>
                <P.Text style={[s.cell, { color: '#5f6677' }]}>{clean(p.ref)}</P.Text>
              </P.View>
            ))}
          </P.View>
        ))}
        <P.View style={s.footer} fixed>
          <P.Text>Opo ULL · Plazos y cifras</P.Text>
          <P.Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </P.View>
      </P.Page>
    </P.Document>
  )
  await save(await P.pdf(doc).toBlob(), 'Plazos_y_cifras_temario.pdf')
}

/** Exporta flashcards en CSV compatible con Anki (frente;reverso;etiqueta) */
export async function downloadAnkiCsv(temaIds: string[]) {
  const rows: string[] = []
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  for (const id of temaIds) {
    const d = await loadDatos(id)
    d?.flashcards.forEach((c) => rows.push([q(c.frente), q(c.reverso + (c.ref ? ` (${c.ref})` : '')), q(`tema_${id}`)].join(';')))
  }
  await save(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }), 'flashcards_anki.csv')
}
