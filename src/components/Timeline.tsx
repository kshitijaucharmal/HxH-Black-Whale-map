import { useEffect, type ReactNode } from 'react'
import { effectiveTiming } from '../lib/data'
import { useStore } from '../store'
import { Play, Pause, Prev, Next } from './icons'

export default function Timeline() {
  const chapters = useStore((s) => s.data.chapters)
  const data = useStore((s) => s.data)
  const last = chapters.length - 1
  const chapterIndex = useStore((s) => s.chapterIndex)
  const setChapterIndex = useStore((s) => s.setChapterIndex)
  const playing = useStore((s) => s.playing)
  const setPlaying = useStore((s) => s.setPlaying)
  const timelineMode = useStore((s) => s.timelineMode)

  const current = chapters[chapterIndex]
  const timing = effectiveTiming(data, chapterIndex)
  const pct = last > 0 ? (chapterIndex / last) * 100 : 0

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const s = useStore.getState()
      if (s.chapterIndex >= last) s.setPlaying(false)
      else s.setChapterIndex(s.chapterIndex + 1)
    }, 850)
    return () => clearInterval(id)
  }, [playing, last])

  const step = (d: number) => {
    setPlaying(false)
    setChapterIndex(Math.max(0, Math.min(last, chapterIndex + d)))
  }

  const primary = timelineMode === 'chapter' ? `Chapter ${current.number}` : `Day ${timing.day ?? '—'}`
  const secondary =
    timelineMode === 'chapter'
      ? current.title ?? (timing.day ? `Day ${timing.day} · ${timing.time ?? ''}` : 'Succession Contest')
      : `${timing.time ?? ''} · Chapter ${current.number}`

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--panel)] px-5 py-3">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => step(-1)} disabled={chapterIndex === 0}><Prev /></IconBtn>
          <button
            onClick={() => setPlaying(!playing)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause width={17} height={17} /> : <Play width={17} height={17} />}
          </button>
          <IconBtn onClick={() => step(1)} disabled={chapterIndex === last}><Next /></IconBtn>
        </div>

        <div className="w-40 shrink-0 leading-tight">
          <div className="text-sm font-bold text-[var(--ink)]">{primary}</div>
          <div className="truncate text-xs text-[var(--muted)]">{secondary}</div>
        </div>

        <div className="flex-1">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={last}
              step={1}
              value={chapterIndex}
              onChange={(e) => { setPlaying(false); setChapterIndex(Number(e.target.value)) }}
              className="scrubber relative z-10"
              style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line-strong) ${pct}%)` }}
            />
            {/* ticks at titled (key) chapters */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              {chapters.map((c, i) =>
                c.title && i !== chapterIndex ? (
                  <span
                    key={c.number}
                    className="absolute h-2 w-px -translate-x-1/2 bg-[var(--muted)]/50"
                    style={{ left: `${last > 0 ? (i / last) * 100 : 0}%` }}
                    title={`Ch. ${c.number} — ${c.title}`}
                  />
                ) : null,
              )}
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium tracking-wide text-[var(--muted)]">
            <span>CH. {chapters[0].number}</span>
            <span>CH. {chapters[last].number}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function IconBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-md text-gray-500 transition-colors hover:bg-[#f5f3ef] hover:text-gray-800 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
