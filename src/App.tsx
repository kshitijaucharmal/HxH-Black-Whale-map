import { useEffect, useMemo } from 'react'
import { countByFaction, getVisibleEvents } from './lib/data'
import { layoutCallouts } from './lib/layout'
import { useStore } from './store'
import MapCanvas from './components/MapCanvas'
import Sidebar from './components/Sidebar'
import Timeline from './components/Timeline'
import Inspector from './components/Inspector'
import Segmented from './components/Segmented'
import { Whale, Pencil } from './components/icons'

export default function App() {
  const loaded = useStore((s) => s.loaded)
  const loadData = useStore((s) => s.loadData)
  const data = useStore((s) => s.data)
  const chapterIndex = useStore((s) => s.chapterIndex)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const timelineMode = useStore((s) => s.timelineMode)
  const setTimelineMode = useStore((s) => s.setTimelineMode)
  const hiddenFactions = useStore((s) => s.hiddenFactions)
  const hiddenTiers = useStore((s) => s.hiddenTiers)
  const editing = useStore((s) => s.editing)
  const setEditing = useStore((s) => s.setEditing)

  useEffect(() => {
    void loadData()
  }, [loadData])

  const { items, factionCounts, tierCounts, total } = useMemo(() => {
    const base = getVisibleEvents(data, chapterIndex, viewMode)
    const factionCounts = countByFaction(base)
    const tierCounts: Record<number, number> = {}
    for (const p of base) tierCounts[p.anchor.tier] = (tierCounts[p.anchor.tier] ?? 0) + 1
    const filtered = base.filter(
      (p) => !hiddenFactions.has(p.character.factionId) && !hiddenTiers.has(p.anchor.tier),
    )
    return { items: layoutCallouts(filtered), factionCounts, tierCounts, total: filtered.length }
  }, [data, chapterIndex, viewMode, hiddenFactions, hiddenTiers])

  if (!loaded) {
    return <div className="grid h-full place-items-center text-sm text-[var(--muted)]">Loading the Black Whale…</div>
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 bg-[var(--ink)] px-5 py-2.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent)]"><Whale width={22} height={22} /></span>
          <span className="wordmark text-[17px] font-bold">Black Whale</span>
          <span className="hidden text-[11px] tracking-wide text-gray-400 uppercase sm:inline">Succession Contest Tracker</span>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Segmented options={[['snapshot', 'This chapter'], ['cumulative', 'Last known']]} value={viewMode} onChange={setViewMode} />
          <Segmented options={[['chapter', 'Chapter'], ['time', 'Day / time']]} value={timelineMode} onChange={setTimelineMode} />
          <button
            onClick={() => setEditing(!editing)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              editing ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-gray-100 hover:bg-white/20'
            }`}
          >
            <Pencil width={14} height={14} /> {editing ? 'Editing' : 'Edit'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar factionCounts={factionCounts} tierCounts={tierCounts} total={total} />
        <main className="relative min-h-0 flex-1 bg-[var(--canvas)]">
          <MapCanvas items={items} />
        </main>
        <Inspector />
      </div>

      <Timeline />
    </div>
  )
}
