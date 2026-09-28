import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { Layout } from '@/components/Layout'
import { LoadingArticle } from '@/components/ui'

const Inicio = lazy(() => import('@/pages/Inicio'))
const Temario = lazy(() => import('@/pages/Temario'))
const TemaPage = lazy(() => import('@/pages/Tema'))
const Tests = lazy(() => import('@/pages/Tests'))
const Simulacro = lazy(() => import('@/pages/Simulacro'))
const Supuestos = lazy(() => import('@/pages/Supuestos'))
const Flashcards = lazy(() => import('@/pages/Flashcards'))
const Repaso = lazy(() => import('@/pages/Repaso'))
const Plazos = lazy(() => import('@/pages/Plazos'))
const Glosario = lazy(() => import('@/pages/Glosario'))
const Examen = lazy(() => import('@/pages/Examen'))
const Plan = lazy(() => import('@/pages/Plan'))
const Estadisticas = lazy(() => import('@/pages/Estadisticas'))
const Fichas = lazy(() => import('@/pages/Fichas'))
const Videos = lazy(() => import('@/pages/Videos'))
const Normativa = lazy(() => import('@/pages/Normativa'))
const Ajustes = lazy(() => import('@/pages/Ajustes'))

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route
            element={
              <Layout>
                <Suspense fallback={<LoadingArticle />}>
                  <RoutesInner />
                </Suspense>
              </Layout>
            }
            path="*"
          />
        </Routes>
      </HashRouter>
    </MotionConfig>
  )
}

function RoutesInner() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/temario" element={<Temario />} />
      <Route path="/tema/:id" element={<TemaPage />} />
      <Route path="/test" element={<Tests />} />
      <Route path="/simulacro" element={<Simulacro />} />
      <Route path="/supuestos" element={<Supuestos />} />
      <Route path="/supuestos/:id" element={<Supuestos />} />
      <Route path="/flashcards" element={<Flashcards />} />
      <Route path="/repaso" element={<Repaso />} />
      <Route path="/plazos" element={<Plazos />} />
      <Route path="/glosario" element={<Glosario />} />
      <Route path="/examen" element={<Examen />} />
      <Route path="/plan" element={<Plan />} />
      <Route path="/estadisticas" element={<Estadisticas />} />
      <Route path="/fichas" element={<Fichas />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/normativa" element={<Normativa />} />
      <Route path="/ajustes" element={<Ajustes />} />
      <Route path="*" element={<Inicio />} />
    </Routes>
  )
}
