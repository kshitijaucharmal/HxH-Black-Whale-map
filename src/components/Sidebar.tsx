import { dataset } from '../lib/data'
import { useStore } from '../store'

const TIERS = [1, 2, 3, 4, 5]

export default function Sidebar({
  factionCounts,
  tierCounts,
  total,
}: {
  factionCounts: Record<string, number>
  tierCounts: Record<number, number>
  total: number
}) {
  const query = useStore((s) => s.query)
  const setQuery = useStore((s) => s.setQuery)
  const hiddenFactions = useStore((s) => s.hiddenFactions)
  const toggleFaction = useStore((s) => s.toggleFaction)
  const hiddenTiers = useStore((s) => s.hiddenTiers)
  const toggleTier = useStore((s) => s.toggleTier)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search characters…"
          className="w-full rounded-md border border-[var(--line)] bg-[#f6f7f9] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Factions</span>
            <span className="text-[11px] text-[var(--muted)]">{total} on map</span>
          </div>
          <ul className="space-y-0.5">
            {dataset.factions.map((f) => {
              const count = factionCounts[f.id] ?? 0
              const on = !hiddenFactions.has(f.id)
              return (
                <li key={f.id}>
                  <button
                    onClick={() => toggleFaction(f.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f2f3f6] ${
                      on ? '' : 'opacity-40'
                    }`}
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ background: f.color }}
                    />
                    <span className="flex-1 truncate text-left text-gray-700">{f.name}</span>
                    <span className="rounded bg-[#eef0f3] px-1.5 text-[11px] font-medium text-[var(--muted)]">
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="border-t border-[var(--line)] p-3">
          <div className="mb-2 eyebrow">Tiers</div>
          <ul className="space-y-0.5">
            {TIERS.map((t) => {
              const count = tierCounts[t] ?? 0
              const on = !hiddenTiers.has(t)
              return (
                <li key={t}>
                  <button
                    onClick={() => toggleTier(t)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f2f3f6] ${
                      on ? '' : 'opacity-40'
                    }`}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-[var(--ink)] text-[11px] font-bold text-white">
                      {t}
                    </span>
                    <span className="flex-1 text-left text-gray-700">Tier {t}</span>
                    <span className="rounded bg-[#eef0f3] px-1.5 text-[11px] font-medium text-[var(--muted)]">
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="border-t border-[var(--line)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">
        Sample data — positions are illustrative. Edit <code>/data</code> to correct.
      </div>
    </aside>
  )
}
