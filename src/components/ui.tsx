import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { animate, motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { bloqueById } from '@/data/temario'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none',
        size === 'sm' && 'h-9 px-3.5 text-sm',
        size === 'md' && 'h-11 px-5 text-[15px]',
        size === 'lg' && 'h-13 px-7 text-base',
        variant === 'primary' && 'bg-primary text-white shadow-[0_8px_20px_-8px_var(--primary)] hover:brightness-110 dark:text-[#0d1016]',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-ink',
        variant === 'soft' && 'bg-primary-soft text-primary hover:brightness-95 dark:hover:brightness-125',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({ className, label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn('focus-ring grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink active:scale-95 cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function AnimatedNumber({ value, decimals = 0, className, suffix = '' }: { value: number; decimals?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const prev = useRef(0)
  useEffect(() => {
    if (!inView || !ref.current) return
    const node = ref.current
    const controls = animate(prev.current, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = v.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, inView, decimals, suffix])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      0{suffix}
    </span>
  )
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  color = 'var(--primary)',
  track = 'var(--line)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (v / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--primary)', className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

export function BloqueBadge({ bloque, className }: { bloque: number; className?: string }) {
  const b = bloqueById(bloque)
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}
      style={{ background: `color-mix(in oklab, ${b.hex} 14%, transparent)`, color: b.hex }}
    >
      <span className="size-1.5 rounded-full" style={{ background: b.hex }} />
      Bloque {b.romano}
    </span>
  )
}

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-[2.6rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </motion.header>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: string; icon?: ReactNode; badge?: ReactNode }[]; value: T; onChange: (t: T) => void; className?: string }) {
  const id = useId()
  return (
    <div className={cn('thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'focus-ring relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            value === t.id ? 'text-white dark:text-[#0d1016]' : 'text-muted hover:text-ink',
          )}
        >
          {value === t.id && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }} />}
          <span className="relative flex items-center gap-2">
            {t.icon}
            {t.label}
            {t.badge}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />
}

export function LoadingArticle() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-8 h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-10/12" />
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</div>}
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {children && <div className="max-w-md text-[15px] text-muted">{children}</div>}
    </motion.div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
            className={cn('card relative max-h-[88vh] w-full overflow-y-auto thin-scroll p-6', wide ? 'max-w-3xl' : 'max-w-lg')}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="font-display text-xl font-semibold">{title}</div>
              <IconButton label="Cerrar" onClick={onClose} className="-mr-2 -mt-2">
                <X size={18} />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Stat({ label, value, icon, hint, to }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode; to?: string }) {
  const inner = (
    <div className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-sm text-muted">{hint}</div>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

/** Contenedor con aparición escalonada de hijos */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } } },
}

export function useLocalToggle(key: string, initial = false) {
  const [v, setV] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(key)
      return s === null ? initial : s === '1'
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, v ? '1' : '0')
    } catch {
      /* sin almacenamiento */
    }
  }, [key, v])
  return [v, setV] as const
}
