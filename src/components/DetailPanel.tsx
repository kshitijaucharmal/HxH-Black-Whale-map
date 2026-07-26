import { appearances, faceSrc } from '../lib/data'
import { useIndex } from '../lib/hooks'
import { useStore } from '../store'

const STATUS_LABEL: Record<string, string> = {
  alive: 'Alive',
  deceased: 'Deceased',
  unknown: 'Unknown',
}

export default function DetailPanel() {
  const data = useStore((s) => s.data)
  const selectedEventId = useStore((s) => s.selectedEventId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const setChapterIndex = useStore((s) => s.setChapterIndex)
  const editing = useStore((s) => s.editing)
  const openCharacterEditor = useStore((s) => s.openCharacterEditor)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const { charactersById, anchorsById, factionsById } = useIndex()

  if (!selectedEventId) return null
  const event = data.events.find((e) => e.id === selectedEventId)
  if (!event) return null

  const character = charactersById.get(event.characterId)
  const anchor = anchorsById.get(event.anchorId)
  const faction = character ? factionsById.get(character.factionId) : undefined
  const color = faction?.color ?? '#888'
  const face = character && anchor ? faceSrc({ event, character, anchor, faction }) : null
  const appears = character ? appearances(data, character.id) : []

  const jumpToChapter = (num: number) => {
    const idx = data.chapters.findIndex((c) => c.number === num)
    if (idx >= 0) setChapterIndex(idx)
  }

  return (
    <div className="absolute top-3 right-3 z-20 max-h-[calc(100%-1.5rem)] w-80 overflow-y-auto rounded-lg border border-[var(--line)] bg-white shadow-xl">
      <div className="flex items-start gap-3 p-4" style={{ borderTop: `3px solid ${color}` }}>
        <div
          className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md text-sm font-bold text-white"
          style={{ background: color }}
        >
          {face ? (
            <img src={face} alt={character?.name} className="h-full w-full object-cover" />
          ) : (
            character?.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base leading-tight font-bold text-[var(--ink)]">{character?.name}</div>
          {character?.aliases?.length ? (
            <div className="truncate text-xs text-[var(--muted)]">aka {character.aliases.join(', ')}</div>
          ) : null}
          {faction && <div className="mt-0.5 text-xs font-medium" style={{ color }}>{faction.name}</div>}
        </div>
        <button onClick={() => setSelectedEventId(null)} className="text-gray-400 hover:text-gray-700">✕</button>
      </div>

      {character?.bio && (
        <p className="px-4 pb-3 text-xs leading-relaxed text-gray-600">{character.bio}</p>
      )}

      <dl className="space-y-2 border-t border-[var(--line)] p-4 text-xs text-gray-600">
        <Row label="Species" value={character?.species} />
        <Row label="Nen type" value={character?.nenType} />
        <Row label="Affiliation" value={character?.affiliation} />
        <Row label="Status" value={character?.status ? STATUS_LABEL[character.status] : undefined} />
      </dl>

      <div className="border-t border-[var(--line)] p-4">
        <div className="eyebrow mb-1.5">Here in ch. {event.chapter}</div>
        <dl className="space-y-2 text-xs text-gray-600">
          <Row label="Location" value={anchor ? `${anchor.label} (Tier ${anchor.tier})` : undefined} />
          <Row
            label="Story time"
            value={event.storyDay ? `Day ${event.storyDay}${event.storyTime ? ` · ${event.storyTime}` : ''}` : undefined}
          />
          {event.hidden && <Row label="Status" value="Hidden / disguised" />}
          {event.note && <Row label="Note" value={event.note} />}
          <Row label="Source" value={event.sourceRef} />
        </dl>
      </div>

      {appears.length > 0 && (
        <div className="border-t border-[var(--line)] p-4">
          <div className="eyebrow mb-1.5">Logged appearances ({appears.length})</div>
          <div className="flex flex-wrap gap-1">
            {appears.map((num) => (
              <button
                key={num}
                onClick={() => jumpToChapter(num)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  num === event.chapter ? 'bg-[var(--accent)] text-white' : 'bg-[#eef0f3] text-gray-600 hover:bg-[#e2e5ea]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-[var(--line)] p-4">
        {character?.wikiUrl && (
          <a href={character.wikiUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--accent)] hover:underline">
            Fandom wiki ↗
          </a>
        )}
        {editing && character && (
          <>
            <button
              onClick={() => openCharacterEditor(character.id)}
              className="ml-auto rounded-md border border-[var(--line)] px-2 py-1 text-xs font-medium text-gray-700 hover:bg-[#f2f3f6]"
            >
              Edit character
            </button>
            <button
              onClick={() => {
                deleteEvent(event.id)
                setSelectedEventId(null)
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete placement
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-medium text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}
