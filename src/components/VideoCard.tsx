import { useState } from 'react'
import { motion } from 'motion/react'
import { Play, ExternalLink, PlayCircle } from 'lucide-react'

export function youtubeId(url: string) {
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url)
  return m?.[1] ?? null
}

export function VideoCard({ titulo, url, canal }: { titulo: string; url: string; canal: string }) {
  const [play, setPlay] = useState(false)
  const id = youtubeId(url)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card group overflow-hidden">
      <div className="relative aspect-video bg-surface-2">
        {id && play ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&hl=es`}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : id ? (
          <button onClick={() => setPlay(true)} className="absolute inset-0 cursor-pointer" aria-label={`Reproducir ${titulo}`}>
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#e62117] shadow-xl transition group-hover:scale-110">
              <Play size={26} fill="currentColor" className="ml-1" />
            </span>
          </button>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 grid place-items-center text-muted">
            <PlayCircle size={40} />
          </a>
        )}
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 font-semibold leading-snug">{titulo}</div>
          <div className="mt-1 text-sm text-muted">{canal}</div>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label="Abrir en YouTube">
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  )
}

export function youtubeSearch(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}
