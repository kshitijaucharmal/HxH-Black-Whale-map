import { useMemo } from 'react'
import { countByFaction, getVisibleEvents } from './lib/data'
import { layoutCallouts } from './lib/layout'
import { useStore } from './store'
import MapCanvas from './components/MapCanvas'
import Sidebar from './components/Sidebar'
import Timeline from './components/Timeline'
import DetailPanel from './components/DetailPanel'
import Segmented from './components/Segmented'

export default function App() {
  const chapterIndex = useStore((s) => s.chapterIndex)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const timelineMode = useStore((s) => s.timelineMode)
  const setTimelineMode = useStore((s) => s.setTimelineMode)
  const hiddenFactions = useStore((s) => s.hiddenFactions)
  const hiddenTiers = useStore((s) => s.hiddenTiers)

  const { items, factionCounts, tierCounts, total } = useMemo(() => {
    const base = getVisibleEvents(chapterIndex, viewMode)
    const factionCounts = countByFaction(base)
    const tierCounts: Record<number, number> = {}
    for (const p of base) tierCounts[p.anchor.tier] = (tierCounts[p.anchor.tier] ?? 0) + 1
    const filtered = base.filter(
      (p) => !hiddenFactions.has(p.character.factionId) && !hiddenTiers.has(p.anchor.tier),
    )
    return {
      items: layoutCallouts(filtered),
      factionCounts,
      tierCounts,
      total: filtered.length,
    }
  }, [chapterIndex, viewMode, hiddenFactions, hiddenTiers])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 bg-[var(--ink)] px-5 py-2.5 text-white">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[var(--accent)]">◆</span>
          <span className="text-sm font-bold tracking-tight">Black Whale Tracker</span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            Hunter × Hunter · Succession Contest
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            options={[
              ['snapshot', 'This chapter'],
              ['cumulative', 'Last known'],
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
          <Segmented
            options={[
              ['chapter', 'Chapter'],
              ['time', 'Day / time'],
            ]}
            value={timelineMode}
            onChange={setTimelineMode}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar factionCounts={factionCounts} tierCounts={tierCounts} total={total} />
        <main className="relative min-h-0 flex-1 bg-[var(--canvas)]">
          <MapCanvas items={items} />
          <DetailPanel />
        </main>
      </div>

      <Timeline />
    </div>
  )
}
