import type { LaidOutCallout } from '../lib/layout'
import { faceSrc } from '../lib/data'
import { useStore } from '../store'

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

/** Scaled face marker on the map, ringed in the faction color. Name on hover. */
export default function Callout({ item, dim }: { item: LaidOutCallout; dim: boolean }) {
  const { placement, bx, by } = item
  const { character, faction, event } = placement
  const selectedEventId = useStore((s) => s.selectedEventId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)

  const selected = selectedEventId === event.id
  const color = faction?.color ?? '#9aa0a6'
  const face = faceSrc(placement)

  return (
    <div
      className={`group absolute z-10 ${dim ? 'opacity-20' : 'opacity-100'}`}
      style={{ left: `${bx}%`, top: `${by}%`, transform: 'translate(-50%, -50%)' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setSelectedEventId(selected ? null : event.id) }}
        className="block h-10 w-10 overflow-hidden rounded-full bg-white transition-transform duration-100 hover:scale-110"
        style={{
          boxShadow: selected
            ? `0 0 0 2px #fff, 0 0 0 4px ${color}, 0 2px 6px rgba(0,0,0,.3)`
            : `0 0 0 2px ${color}, 0 1px 4px rgba(0,0,0,.28)`,
        }}
        title={character.name}
      >
        {face ? (
          <img src={face} alt={character.name} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] font-bold text-white" style={{ background: color }}>
            {initials(character.name)}
          </span>
        )}
      </button>

      {event.hidden && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400" title="Hidden / disguised" />
      )}

      <span
        className={`pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 rounded-md bg-[var(--ink)] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg transition-opacity duration-100 ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {character.name}
      </span>
    </div>
  )
}
