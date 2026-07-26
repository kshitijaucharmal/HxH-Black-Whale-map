import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { LaidOutCallout } from '../lib/layout'
import Callout from './Callout'
import { useStore } from '../store'

const MAP_SRC = '/map/black-whale.png'

function matches(item: LaidOutCallout, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const c = item.placement.character
  return (
    c.name.toLowerCase().includes(q) ||
    (c.aliases ?? []).some((a) => a.toLowerCase().includes(q))
  )
}

/**
 * Pan/zoom base map with an overlay of leader lines + callout boxes.
 * All overlay geometry is in percent so it tracks the image at any zoom.
 */
export default function MapCanvas({ items }: { items: LaidOutCallout[] }) {
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const query = useStore((s) => s.query)

  return (
    <TransformWrapper
      minScale={0.6}
      maxScale={6}
      initialScale={1}
      centerOnInit
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.15 }}
    >
      <TransformComponent
        wrapperStyle={{ width: '100%', height: '100%' }}
        contentStyle={{ width: 'auto' }}
      >
        <div className="relative w-fit select-none" onClick={() => setSelectedEventId(null)}>
          <img
            src={MAP_SRC}
            alt="Black Whale cross-section"
            className="block max-w-none rounded-sm"
            draggable={false}
          />

          {/* Leader lines + anchor dots */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {items.map((it) => {
              const on = matches(it, query)
              const color = it.placement.faction?.color ?? '#888'
              return (
                <g key={`line-${it.placement.event.id}`} opacity={on ? 0.9 : 0.2}>
                  <line
                    x1={`${it.ax}%`}
                    y1={`${it.ay}%`}
                    x2={`${it.bx}%`}
                    y2={`${it.by}%`}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <circle cx={`${it.ax}%`} cy={`${it.ay}%`} r={5} fill="#fff" stroke={color} strokeWidth={2} />
                  <circle cx={`${it.ax}%`} cy={`${it.ay}%`} r={2} fill={color} />
                </g>
              )
            })}
          </svg>

          {/* Callout boxes */}
          {items.map((it) => (
            <Callout key={it.placement.event.id} item={it} dim={!matches(it, query)} />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
