# Opo ULL · Escala Administrativa (C1)

Web personal de estudio para la oposición a la **Escala Administrativa (Grupo C, Subgrupo C1) de la Universidad de La Laguna**, convocada por Resolución de 6 de agosto de 2026 (BOC nº 166, de 19/08/2026): 47 plazas, concurso-oposición.

**Web:** https://ray86-dev.github.io/opo-admin-ull/

## Qué incluye

- **Los 29 temas del programa** desarrollados a partir de la normativa oficial, con índice, progreso de lectura y **lectura en voz alta** (con resaltado del párrafo y velocidad ajustable; en Microsoft Edge usa las voces neuronales en español de España).
- Por cada tema: **resumen**, **esquema** como mapa mental interactivo, **ideas clave**, **tabla de plazos y cifras**, **reglas mnemotécnicas**, **glosario**, **flashcards**, **test** y **vídeos**.
- **Tests** a medida (por temas, dificultad, nuevas, falladas o favoritas) con la corrección del examen real: cada 3 fallos restan un acierto.
- **Supuestos prácticos** ambientados en la ULL (15 preguntas cada uno, como el segundo ejercicio).
- **Simulacros** de los dos ejercicios con el tiempo real (90 min y 2 h), preguntas de reserva y el mínimo de 5 en cada supuesto.
- **Flashcards con repaso espaciado**, **repaso de fallos**, **plazos y cifras** en modo autoevaluación, **glosario** y **buscador global** (Ctrl+K).
- **Cómo es el examen**: proceso, corrección, calculadora de nota con concurso de méritos y estrategia de respuesta.
- **Plan de estudio** semanal hasta la fecha del examen, **estadísticas**, calendario de constancia y racha.
- **Fichas en PDF** por tema, por bloque o de todo el temario; flashcards recortables y exportación a Anki.
- **Normativa oficial** en PDF (BOE consolidado, BOC y ULL) en la carpeta [`normativa/`](normativa/).
- Funciona **sin conexión** y se puede instalar en el móvil como una app (PWA). El progreso se guarda en el navegador, con copia de seguridad exportable.

## Tecnología

Vite · React 19 · TypeScript · Tailwind CSS 4 · Motion · Zustand · markmap · react-pdf · Web Speech API · vite-plugin-pwa. Se publica automáticamente en GitHub Pages con cada `push` a `main`.

```bash
npm install
npm run dev            # http://localhost:5173/opo-admin-ull/
npm run build          # compila en dist/
npm run check:content  # valida el contenido (preguntas, supuestos…)
```

## Contenido

- `src/content/temas/{bloque}-{tema}/`: `tema.md`, `resumen.md`, `esquema.md` y `datos.json` (claves, plazos, glosario, mnemotecnias, flashcards, preguntas, vídeos).
- `src/content/supuestos/*.json`: supuestos prácticos.
- `docs/CONTENT_SPEC.md`: formato del contenido.

> El contenido se ha redactado a partir de los textos legales consolidados, pero puede contener errores. Ante cualquier duda, manda la norma oficial (BOE/BOC) vigente el día del examen.
