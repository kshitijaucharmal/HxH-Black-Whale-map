import type { LaidOutCallout } from '../lib/layout'
import { faceSrc } from '../lib/data'
import { useStore } from '../store'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * A scaled-down face marker on the map: a round avatar ringed in the faction
 * color, centered on its connect point. The character name appears on hover.
 * Falls back to initials when no face image is set.
 */
export default function Callout({ item, dim }: { item: LaidOutCallout; dim: boolean }) {
  const { placement, bx, by } = item
  const { character, faction, event } = placement
  const selectedEventId = useStore((s) => s.selectedEventId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)

  const selected = selectedEventId === event.id
  const color = faction?.color ?? '#888'
  const face = faceSrc(placement)

  return (
    <div
      className={`group absolute z-10 ${dim ? 'opacity-25' : 'opacity-100'}`}
      style={{ left: `${bx}%`, top: `${by}%`, transform: 'translate(-50%, -50%)' }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          setSelectedEventId(selected ? null : event.id)
        }}
        className="block h-11 w-11 overflow-hidden rounded-full bg-white shadow-[0_2px_6px_rgba(20,22,29,0.35)] transition-transform hover:scale-110"
        style={{ border: `3px solid ${color}`, outline: selected ? '2px solid #14161d' : 'none', outlineOffset: 2 }}
        title={character.name}
      >
        {face ? (
          <img src={face} alt={character.name} className="h-full w-full object-cover" />
        ) : (
          <span
            className="grid h-full w-full place-items-center text-[11px] font-bold text-white"
            style={{ background: color }}
          >
            {initials(character.name)}
          </span>
        )}
      </button>

      {event.hidden && (
        <span
          className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[8px] font-black text-black shadow"
          title="Present under a disguise / hidden identity"
        >
          !
        </span>
      )}

      {/* Name on hover */}
      <span
        className={`pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded bg-[var(--ink)] px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
          selected ? 'opacity-100' : ''
        }`}
      >
        {character.name}
      </span>
    </div>
  )
}
