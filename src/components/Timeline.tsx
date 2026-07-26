import { useEffect } from 'react'
import { dataset, effectiveTiming } from '../lib/data'
import { useStore } from '../store'

export default function Timeline() {
  const { chapters } = dataset
  const last = chapters.length - 1
  const chapterIndex = useStore((s) => s.chapterIndex)
  const setChapterIndex = useStore((s) => s.setChapterIndex)
  const playing = useStore((s) => s.playing)
  const setPlaying = useStore((s) => s.setPlaying)
  const timelineMode = useStore((s) => s.timelineMode)

  const current = chapters[chapterIndex]
  const timing = effectiveTiming(chapterIndex)
  const pct = last > 0 ? (chapterIndex / last) * 100 : 0

  // Auto-advance while playing; stop at the end.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const s = useStore.getState()
      if (s.chapterIndex >= last) {
        s.setPlaying(false)
      } else {
        s.setChapterIndex(s.chapterIndex + 1)
      }
    }, 850)
    return () => clearInterval(id)
  }, [playing, last])

  const step = (d: number) => {
    setPlaying(false)
    setChapterIndex(Math.max(0, Math.min(last, chapterIndex + d)))
  }

  const primary =
    timelineMode === 'chapter'
      ? `Chapter ${current.number}`
      : `Day ${timing.day ?? '—'}`
  const secondary =
    timelineMode === 'chapter'
      ? current.title ?? (timing.day ? `Day ${timing.day} · ${timing.time ?? ''}` : '')
      : `${timing.time ?? ''} · Chapter ${current.number}`

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--panel)] px-5 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <TransportButton label="◀◀" onClick={() => step(-1)} disabled={chapterIndex === 0} />
          <button
            onClick={() => setPlaying(!playing)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white shadow-sm transition-transform hover:scale-105"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <TransportButton label="▶▶" onClick={() => step(1)} disabled={chapterIndex === last} />
        </div>

        <div className="w-44 shrink-0 leading-tight">
          <div className="text-sm font-bold text-[var(--ink)]">{primary}</div>
          <div className="truncate text-xs text-[var(--muted)]">{secondary}</div>
        </div>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={chapterIndex}
            onChange={(e) => {
              setPlaying(false)
              setChapterIndex(Number(e.target.value))
            }}
            className="scrubber"
            style={{
              background: `linear-gradient(to right, var(--accent) ${pct}%, #d4d8df ${pct}%)`,
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] font-medium text-[var(--muted)]">
            <span>Ch. {chapters[0].number}</span>
            <span>Ch. {chapters[last].number}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function TransportButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-md text-xs text-gray-600 hover:bg-[#f2f3f6] disabled:opacity-30"
    >
      {label}
    </button>
  )
}
