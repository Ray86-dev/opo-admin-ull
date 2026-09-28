import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Crosshair, ChevronsDownUp, ChevronsUpDown, List, Network } from 'lucide-react'
import type { Markmap } from 'markmap-view'
import { cn } from '@/lib/cn'
import { Markdown } from './Markdown'
import { Tabs } from './ui'

const COLORS = ['#2f4fd6', '#ef6a4c', '#0f9488', '#d97706', '#b1437a', '#7c3aed', '#0891b2']

export function MindMap({ md }: { md: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const mmRef = useRef<Markmap | null>(null)
  const rootRef = useRef<unknown>(null)
  const [full, setFull] = useState(false)
  const [vista, setVista] = useState<'mapa' | 'lista'>('mapa')

  useEffect(() => {
    if (vista !== 'mapa') return
    let disposed = false
    ;(async () => {
      const [{ Transformer }, { Markmap }] = await Promise.all([import('markmap-lib'), import('markmap-view')])
      if (disposed || !svgRef.current) return
      const { root } = new Transformer().transform(md)
      rootRef.current = root
      svgRef.current.innerHTML = ''
      mmRef.current = Markmap.create(
        svgRef.current,
        {
          autoFit: true,
          duration: 450,
          initialExpandLevel: 2,
          maxWidth: 300,
          paddingX: 14,
          spacingVertical: 8,
          spacingHorizontal: 90,
          color: (node) => COLORS[(node.state?.path?.split('.').length ?? 1) > 1 ? Number(node.state.path.split('.')[1] ?? 0) % COLORS.length : 0],
        },
        root,
      )
    })()
    return () => {
      disposed = true
      mmRef.current?.destroy()
      mmRef.current = null
    }
  }, [md, vista])

  useEffect(() => {
    const t = setTimeout(() => mmRef.current?.fit(), 350)
    return () => clearTimeout(t)
  }, [full])

  const expandAll = async (expand: boolean) => {
    const mm = mmRef.current
    const root = rootRef.current as { payload?: { fold?: number }; children?: unknown[] } | null
    if (!mm || !root) return
    const walk = (n: { payload?: { fold?: number }; children?: unknown[] }, depth: number) => {
      n.payload = { ...n.payload, fold: expand ? 0 : depth >= 1 ? 1 : 0 }
      n.children?.forEach((c) => walk(c as typeof n, depth + 1))
    }
    walk(root, 0)
    await mm.setData(root as never)
    await mm.fit()
  }

  return (
    <div className={cn(full && 'fixed inset-0 z-[70] flex flex-col bg-paper p-3 md:p-6')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs
          value={vista}
          onChange={setVista}
          tabs={[
            { id: 'mapa', label: 'Mapa mental', icon: <Network size={15} /> },
            { id: 'lista', label: 'Esquema en lista', icon: <List size={15} /> },
          ]}
        />
        {vista === 'mapa' && (
          <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            <Tool label="Desplegar todo" onClick={() => expandAll(true)}><ChevronsUpDown size={15} /></Tool>
            <Tool label="Plegar" onClick={() => expandAll(false)}><ChevronsDownUp size={15} /></Tool>
            <Tool label="Acercar" onClick={() => mmRef.current?.rescale(1.25)}><ZoomIn size={15} /></Tool>
            <Tool label="Alejar" onClick={() => mmRef.current?.rescale(0.8)}><ZoomOut size={15} /></Tool>
            <Tool label="Centrar" onClick={() => mmRef.current?.fit()}><Crosshair size={15} /></Tool>
            <Tool label={full ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={() => setFull((f) => !f)}>
              {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </Tool>
          </div>
        )}
      </div>
      {vista === 'mapa' ? (
        <div className={cn('markmap-host card overflow-hidden', full ? 'flex-1' : 'h-[68vh] min-h-[420px]')}>
          <svg ref={svgRef} />
        </div>
      ) : (
        <div className="card p-6">
          <Markdown source={md.replace(/^# .*$/m, '')} className="prose-opo sans !text-[16px]" />
        </div>
      )}
      {vista === 'mapa' && !full && <p className="mt-2 text-xs text-muted">Pulsa los círculos para desplegar ramas. Arrastra para moverte y usa la rueda o pellizca para hacer zoom.</p>}
    </div>
  )
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} className="grid size-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
      {children}
    </button>
  )
}
