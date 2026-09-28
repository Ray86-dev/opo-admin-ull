# Especificación de contenido — Web de estudio Escala Administrativa ULL (C1)

Web personal de estudio para UNA opositora que prepara la oposición de la **Escala Administrativa (C1) de la Universidad de La Laguna** (Resolución de 6/8/2026, BOC nº 166 de 19/8/2026). El contenido debe permitirle **aprobar**: preciso, actualizado, fiel a la ley y orientado al examen.

## El examen (para orientar el contenido)

- **Ejercicio 1**: test de 100 preguntas (+10 de reserva), 4 opciones, 1 correcta, 90 min. Cada 3 errores restan 1 acierto. Mínimo 5/10. Cubre TODO el temario.
- **Ejercicio 2**: 3 supuestos prácticos a elegir entre 4 (uno por bloque). Cada supuesto: 15 preguntas tipo test de 4 opciones. Misma penalización. 2 horas. Mínimo 5 en cada supuesto.
- Las preguntas de oposición de universidades canarias son muy literales: plazos, órganos competentes, mayorías, porcentajes, artículos, enumeraciones ("¿cuál NO es...?"), definiciones legales.

## Reglas de oro

1. **Fuente = el texto legal real.** Los textos consolidados están en `fuentes-txt/*.txt` (extraídos de los PDF de `normativa/`). LEE los artículos relevantes antes de redactar. No te fíes de la memoria para plazos, cifras, mayorías, órganos o numeración de artículos: compruébalos en el texto. Si una norma está modificada, usa la redacción consolidada vigente.
2. Cita siempre el artículo: `(art. 21.3 LPAC)`. Usa las abreviaturas estándar: CE, LPAC (Ley 39/2015), LRJSP (Ley 40/2015), LCSP (Ley 9/2017), LTAIBG (Ley 19/2013), RGPD, LOPDGDD, TREBEP, LOSU (LO 2/2023), LOIEMH (LO 3/2007), LGSS, LGP, LJCA, ET, LCTI (Ley 14/2011), EPIPF (RD 103/2019), EULL (Estatutos ULL, Decreto 66/2022), RAE-ULL (Reglamento de Administración Electrónica ULL 2025), BEP-ULL (Bases de ejecución del presupuesto ULL 2026).
3. **Nada inventado.** Si algo no aparece en las fuentes y no estás seguro, no lo afirmes. Puedes usar WebSearch/WebFetch para comprobar (preferencia: boe.es, gobiernodecanarias.org/boc, ull.es).
4. Español de España, claro, didáctico, pensado para memorizar. Sin relleno. Tuteo en los consejos ("Ojo: ...").
5. Escribe los ficheros con la herramienta Write, en UTF-8. No toques nada fuera de las carpetas que se te asignen.

## Estructura por tema

Cada tema vive en `src/content/temas/{id}/` (ids: `1-01`…`1-11`, `2-01`…`2-06`, `3-01`…`3-04`, `4-01`…`4-08`; el primer dígito es el bloque). Cuatro ficheros:

### 1. `tema.md` — desarrollo completo (lo que lee en pantalla y escucha con texto a voz)

- **Extensión orientativa: 5.000–9.000 palabras.** Debe cubrir TODOS los epígrafes oficiales del tema, en su orden, con la profundidad de un buen temario de academia.
- No pongas el título del tema como `#` (la web ya lo muestra). Empieza con un párrafo de introducción (2–4 frases) y después secciones `##` (una por epígrafe oficial) y `###` para subsecciones.
- Usa tablas GFM para comparar (p. ej. nulidad vs anulabilidad, tipos de recursos con plazos, órganos y competencias).
- Callouts (bloque de cita que empieza por una etiqueta; la web los pinta con color e icono). Úsalos con moderación, 1–3 por sección:
  - `> [!EXAMEN] ...` — lo que más cae / trampas típicas.
  - `> [!PLAZO] ...` — plazos y cifras clave.
  - `> [!TRUCO] ...` — regla mnemotécnica.
  - `> [!IMPORTANTE] ...` — matices clave.
  - `> [!ULL] ...` — especificidad de la Universidad de La Laguna.
- Negritas para los términos y datos que hay que memorizar. Listas para enumeraciones legales (respeta las letras a), b), c) de la ley cuando se pregunten enumeraciones).
- El texto se leerá con texto a voz: evita emojis, símbolos raros o ASCII-art. Nada de HTML.

### 2. `resumen.md` — resumen para repaso rápido

- 900–1.500 palabras. Mismo formato Markdown (`##`, listas, tablas, callouts permitidos). Lo esencial para repasar el día antes del examen.

### 3. `esquema.md` — esquema/mapa mental

- Se renderiza como mapa mental interactivo (markmap). Formato: una única línea `# Título corto del tema`, luego `##` ramas principales (una por epígrafe), `###` sub-ramas y viñetas `-` para hojas (puede haber viñetas anidadas con 2 espacios).
- Etiquetas CORTAS (máx. ~70 caracteres), telegráficas, con los datos clave: "Recurso de alzada: 1 mes (acto expreso)", "Silencio: positivo por regla general (art. 24)".
- 60–150 nodos en total.

### 4. `datos.json` — datos estructurados

```ts
{
  "claves": string[],            // 10–15 ideas clave del tema (una frase cada una)
  "plazos": { "concepto": string, "valor": string, "ref": string }[],   // TODOS los plazos, cifras, mayorías, porcentajes y edades del tema. Ej: {"concepto":"Plazo del recurso de alzada (acto expreso)","valor":"1 mes","ref":"art. 122.1 LPAC"}
  "glosario": { "termino": string, "definicion": string }[],           // 8–20 términos
  "mnemotecnias": { "titulo": string, "texto": string }[],             // 2–6 reglas mnemotécnicas útiles (reales, que funcionen en español)
  "flashcards": { "frente": string, "reverso": string, "ref": string }[],// 25–40 tarjetas pregunta/respuesta breves
  "preguntas": {
    "enunciado": string,
    "opciones": [string, string, string, string],   // SIEMPRE 4, sin letras delante ("a)" lo pone la web)
    "correcta": 0 | 1 | 2 | 3,                      // índice de la correcta. Reparte las posiciones de forma equilibrada.
    "explicacion": string,                          // por qué es correcta (y, si ayuda, por qué fallan las otras), con artículo
    "ref": string,                                  // "art. 112 LPAC"
    "dificultad": 1 | 2 | 3                         // 1 fácil, 2 media, 3 difícil
  }[],                                              // 45–60 preguntas por tema, estilo examen real
  "videos": { "titulo": string, "url": string, "canal": string }[],    // 2–6 vídeos de YouTube REALES encontrados con WebSearch sobre este tema (no inventes URLs ni IDs; si no encuentras, deja [])
  "enlaces": { "titulo": string, "url": string }[]                     // enlaces oficiales útiles (BOE consolidado, BOC, ull.es, guías oficiales)
}
```

Normas para las preguntas:
- Estilo oposición: literales, sobre plazos, órganos, porcentajes, enumeraciones, excepciones, definiciones, "señale la INCORRECTA", "no es...". Distractores verosímiles (plazos cambiados, órgano parecido, cifra cercana), nunca absurdos.
- Cubre todos los epígrafes del tema de forma proporcional. Mezcla dificultades (aprox. 30 % fáciles, 45 % medias, 25 % difíciles).
- Evita "todas las anteriores son correctas" salvo en 1–2 casos por tema.
- Una sola respuesta indiscutiblemente correcta según el texto legal vigente.
- El JSON debe ser válido (comillas dobles escapadas con `\"`, sin comas finales). Valídalo al terminar con: `node -e "JSON.parse(require('fs').readFileSync('RUTA','utf8'))"`.

## Supuestos prácticos

Ficheros `src/content/supuestos/{bloque}-{n}.json` (p. ej. `1-1.json`…`1-5.json`). Formato:

```ts
{
  "bloque": 1 | 2 | 3 | 4,
  "titulo": string,              // "Recurso contra la denegación de una beca"
  "temas": string[],             // ids de tema relacionados, p. ej. ["1-04","1-06"]
  "enunciado": string,           // Markdown. Caso realista ambientado en la Universidad de La Laguna (servicios, facultades, PTGAS, estudiantado, contratos...), 250–600 palabras, con fechas, cantidades y datos concretos necesarios para responder.
  "preguntas": [ ...15 preguntas con el mismo formato que en datos.json... ]
}
```

- Exactamente **15 preguntas** por supuesto, que obliguen a aplicar la norma al caso (calcular plazos, determinar órgano competente, recurso procedente, tipo de contrato, cuantías, situación administrativa, etc.), como en el segundo ejercicio real.
- Cuando el cálculo dependa de fechas, fija en el enunciado fechas y días de la semana coherentes y explica el cómputo en la explicación.
