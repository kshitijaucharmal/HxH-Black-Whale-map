import { useEffect, useMemo } from 'react'
import { countByFaction, getVisibleEvents } from './lib/data'
import { layoutCallouts } from './lib/layout'
import { useStore } from './store'
import MapCanvas from './components/MapCanvas'
import Sidebar from './components/Sidebar'
import Timeline from './components/Timeline'
import DetailPanel from './components/DetailPanel'
import Segmented from './components/Segmented'
import EditorColumn from './components/editor/EditorColumn'
import CharacterEditor from './components/editor/CharacterEditor'

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
  const editingCharacterId = useStore((s) => s.editingCharacterId)

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
        <div className="flex items-baseline gap-2.5">
          <span className="text-[var(--accent)]">◆</span>
          <span className="text-sm font-bold tracking-tight">Black Whale Tracker</span>
          <span className="hidden text-xs text-gray-400 sm:inline">Hunter × Hunter · Succession Contest</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            options={[['snapshot', 'This chapter'], ['cumulative', 'Last known']]}
            value={viewMode}
            onChange={setViewMode}
          />
          <Segmented
            options={[['chapter', 'Chapter'], ['time', 'Day / time']]}
            value={timelineMode}
            onChange={setTimelineMode}
          />
          <button
            onClick={() => setEditing(!editing)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              editing ? 'bg-[var(--accent)] text-white' : 'border border-white/15 text-gray-200 hover:bg-white/10'
            }`}
          >
            {editing ? 'Done editing' : 'Edit'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar factionCounts={factionCounts} tierCounts={tierCounts} total={total} />
        <main className="relative min-h-0 flex-1 bg-[var(--canvas)]">
          <MapCanvas items={items} />
          <DetailPanel />
          {editingCharacterId && <CharacterEditor key={editingCharacterId} />}
        </main>
        {editing && <EditorColumn />}
      </div>

      <Timeline />
    </div>
  )
}
