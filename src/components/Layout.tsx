import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen, Home, ListChecks, Timer, Layers, Clock3, BookA, PlayCircle, ClipboardList, RotateCcw, CalendarDays,
  BarChart3, FileDown, Scale, GraduationCap, Settings, Menu, X, Search, Moon, Sun, Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useProgress } from '@/store/progress'
import { TtsPlayer } from './TtsPlayer'
import { SearchPalette } from './SearchPalette'
import { IconButton } from './ui'
import { Onboarding } from './Onboarding'

interface NavItem { to: string; label: string; icon: typeof Home }
const NAV: { grupo: string; items: NavItem[] }[] = [
  {
    grupo: 'Estudiar',
    items: [
      { to: '/', label: 'Inicio', icon: Home },
      { to: '/temario', label: 'Temario', icon: BookOpen },
      { to: '/flashcards', label: 'Flashcards', icon: Layers },
      { to: '/plazos', label: 'Plazos y cifras', icon: Clock3 },
      { to: '/glosario', label: 'Glosario', icon: BookA },
      { to: '/videos', label: 'Vídeos', icon: PlayCircle },
    ],
  },
  {
    grupo: 'Practicar',
    items: [
      { to: '/test', label: 'Tests', icon: ListChecks },
      { to: '/supuestos', label: 'Supuestos prácticos', icon: Briefcase },
      { to: '/simulacro', label: 'Simulacro de examen', icon: Timer },
      { to: '/repaso', label: 'Repaso de fallos', icon: RotateCcw },
    ],
  },
  {
    grupo: 'Organizar',
    items: [
      { to: '/examen', label: 'Cómo es el examen', icon: GraduationCap },
      { to: '/plan', label: 'Plan de estudio', icon: CalendarDays },
      { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
      { to: '/fichas', label: 'Fichas descargables', icon: FileDown },
      { to: '/normativa', label: 'Normativa oficial', icon: Scale },
    ],
  },
]

const MOBILE: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/temario', label: 'Temario', icon: BookOpen },
  { to: '/test', label: 'Tests', icon: ListChecks },
  { to: '/simulacro', label: 'Examen', icon: ClipboardList },
]

function useTheme() {
  const tema = useProgress((s) => s.settings.tema)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = tema === 'oscuro' || (tema === 'sistema' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0d1016' : '#f7f4ee')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [tema])
}

/** Suma tiempo de estudio mientras la pestaña está visible y hay actividad reciente */
function useStudyTimer() {
  const addMinutes = useProgress((s) => s.addMinutes)
  const last = useRef(Date.now())
  useEffect(() => {
    const bump = () => (last.current = Date.now())
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    const id = setInterval(() => {
      const speaking = typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking
      if (document.visibilityState === 'visible' && (Date.now() - last.current < 3 * 60_000 || speaking)) addMinutes(0.5)
    }, 30_000)
    return () => {
      clearInterval(id)
      evs.forEach((e) => window.removeEventListener(e, bump))
    }
  }, [addMinutes])
}

function SideLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] font-medium transition-colors',
          isActive ? 'text-ink' : 'text-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
          <Icon size={18} className={cn('relative transition-colors', isActive ? 'text-primary' : 'group-hover:text-ink')} />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function Brand() {
  return (
    <Link to="/" className="focus-ring flex items-center gap-3 rounded-xl px-2">
      <div className="relative grid size-10 place-items-center rounded-2xl bg-primary text-white shadow-[0_8px_20px_-8px_var(--primary)] dark:text-[#0d1016]">
        <GraduationCap size={22} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[17px] font-semibold">Opo ULL</div>
        <div className="text-[11.5px] text-muted">Escala Administrativa · C1</div>
      </div>
    </Link>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto thin-scroll px-3 py-5">
      <Brand />
      {NAV.map((g) => (
        <div key={g.grupo}>
          <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/80">{g.grupo}</div>
          <div className="flex flex-col gap-0.5">
            {g.items.map((it) => (
              <SideLink key={it.to} item={it} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-auto">
        <SideLink item={{ to: '/ajustes', label: 'Ajustes y copia', icon: Settings }} onClick={onNavigate} />
      </div>
    </nav>
  )
}

export function Layout({ children }: { children?: ReactNode }) {
  useTheme()
  useStudyTimer()
  const loc = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const { tema } = useProgress((s) => s.settings)
  const setSettings = useProgress((s) => s.setSettings)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setDrawer(false)
  }, [loc.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const focusMode = /^\/(simulacro|supuestos\/[^/]+)$/.test(loc.pathname) && loc.search.includes('run')

  return (
    <div className="bg-grain min-h-dvh">
      {!focusMode && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line/70 bg-paper/80 backdrop-blur-xl lg:block">
          <Sidebar />
        </aside>
      )}

      {/* Barra superior */}
      <header className={cn('no-print sticky top-0 z-30 border-b border-line/60 bg-paper/75 backdrop-blur-xl', !focusMode && 'lg:pl-64')}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:px-8">
          {!focusMode && (
            <IconButton label="Menú" className="lg:hidden" onClick={() => setDrawer(true)}>
              <Menu size={20} />
            </IconButton>
          )}
          <div className="lg:hidden">{!focusMode && <Brand />}</div>
          <button
            onClick={() => setSearch(true)}
            className="focus-ring ml-auto flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-muted transition hover:text-ink md:w-72"
          >
            <Search size={16} />
            <span className="hidden md:inline">Buscar en el temario…</span>
            <kbd className="ml-auto hidden rounded-md border border-line px-1.5 text-[11px] md:inline">Ctrl K</kbd>
          </button>
          <IconButton
            label={isDark ? 'Modo claro' : 'Modo oscuro'}
            onClick={() => setSettings({ tema: isDark ? 'claro' : 'oscuro' })}
            key={tema}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </div>
      </header>

      <main className={cn('pb-36 lg:pb-24', !focusMode && 'lg:pl-64')}>
        <motion.div
          key={loc.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10"
        >
          {children ?? <Outlet />}
        </motion.div>
      </main>

      {/* Navegación inferior móvil */}
      {!focusMode && (
        <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5">
            {MOBILE.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === '/'} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted')}>
                <it.icon size={21} />
                {it.label}
              </NavLink>
            ))}
            <button onClick={() => setDrawer(true)} className="flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted">
              <Menu size={21} />
              Más
            </button>
          </div>
        </nav>
      )}

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
              className="absolute inset-y-0 left-0 w-72 bg-paper shadow-2xl"
            >
              <IconButton label="Cerrar menú" className="absolute right-2 top-4 z-10" onClick={() => setDrawer(false)}>
                <X size={20} />
              </IconButton>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TtsPlayer />
      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <Onboarding />
    </div>
  )
}
