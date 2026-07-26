import type { CSSProperties } from 'react'
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
 * A manga-style callout: face crop + name, faction-colored accent, on a clean
 * white card. Positioned by its connect point (bx, by); the box grows away from
 * the anchor. `dim` fades callouts that don't match the current search.
 */
export default function Callout({ item, dim }: { item: LaidOutCallout; dim: boolean }) {
  const { placement, bx, by, side } = item
  const { character, faction, event } = placement
  const selectedEventId = useStore((s) => s.selectedEventId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)

  const selected = selectedEventId === event.id
  const color = faction?.color ?? '#888'
  const face = faceSrc(placement)

  const style: CSSProperties = {
    left: `${bx}%`,
    top: `${by}%`,
    transform: `translateY(-50%) ${side === 'left' ? 'translateX(-100%)' : ''}`,
  }
  if (selected) (style as Record<string, string>)['--tw-ring-color'] = color

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setSelectedEventId(selected ? null : event.id)
      }}
      className={`group absolute z-10 flex items-stretch overflow-hidden rounded-md bg-white text-left shadow-[0_2px_8px_rgba(20,22,29,0.18)] ring-1 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(20,22,29,0.25)] ${
        selected ? 'ring-2' : 'ring-black/10'
      } ${dim ? 'opacity-25' : 'opacity-100'}`}
      style={style}
    >
      <span className="w-1 shrink-0" style={{ background: color }} />
      <span
        className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden text-[10px] font-bold text-white"
        style={{ background: color }}
      >
        {face ? (
          <img src={face} alt={character.name} className="h-full w-full object-cover" />
        ) : (
          initials(character.name)
        )}
      </span>
      <span className="flex items-center gap-1 px-2 text-xs font-semibold whitespace-nowrap text-gray-800">
        {character.name}
        {event.hidden && (
          <span
            className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700"
            title="Present under a disguise / hidden identity"
          >
            HIDDEN
          </span>
        )}
      </span>
    </button>
  )
}
