import { anchorsById, charactersById, dataset, factionsById, faceSrc } from '../lib/data'
import { useStore } from '../store'

export default function DetailPanel() {
  const selectedEventId = useStore((s) => s.selectedEventId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  if (!selectedEventId) return null

  const event = dataset.events.find((e) => e.id === selectedEventId)
  if (!event) return null

  const character = charactersById.get(event.characterId)
  const anchor = anchorsById.get(event.anchorId)
  const faction = character ? factionsById.get(character.factionId) : undefined
  const color = faction?.color ?? '#888'
  const face =
    character && anchor
      ? faceSrc({ event, character, anchor, faction })
      : null

  return (
    <div className="absolute top-3 right-3 z-20 w-72 overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-xl">
      <div className="flex items-center gap-3 p-4" style={{ borderTop: `3px solid ${color}` }}>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md text-sm font-bold text-white"
          style={{ background: color }}
        >
          {face ? (
            <img src={face} alt={character?.name} className="h-full w-full object-cover" />
          ) : (
            character?.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-[var(--ink)]">{character?.name}</div>
          {faction && <div className="text-xs" style={{ color }}>{faction.name}</div>}
        </div>
        <button
          onClick={() => setSelectedEventId(null)}
          className="ml-auto self-start text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <dl className="space-y-2 border-t border-[var(--line)] p-4 text-xs text-gray-600">
        <Row label="Location" value={anchor?.label} />
        <Row label="Tier" value={anchor ? String(anchor.tier) : undefined} />
        <Row label="Chapter" value={String(event.chapter)} />
        <Row
          label="Story time"
          value={
            event.storyDay
              ? `Day ${event.storyDay}${event.storyTime ? ` · ${event.storyTime}` : ''}`
              : undefined
          }
        />
        {event.hidden && <Row label="Status" value="Hidden / disguised" />}
        {event.note && <Row label="Note" value={event.note} />}
        <Row label="Source" value={event.sourceRef} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 font-medium text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}
