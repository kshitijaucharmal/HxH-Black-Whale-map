import { useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { LaidOutCallout } from '../lib/layout'
import Callout from './Callout'
import { useStore } from '../store'

const MAP_SRC = '/map/black-whale.png'

function matches(item: LaidOutCallout, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const c = item.placement.character
  return c.name.toLowerCase().includes(q) || (c.aliases ?? []).some((a) => a.toLowerCase().includes(q))
}

export default function MapCanvas({ items }: { items: LaidOutCallout[] }) {
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const query = useStore((s) => s.query)
  const editing = useStore((s) => s.editing)
  const addAnchorMode = useStore((s) => s.addAnchorMode)
  const setAddAnchorMode = useStore((s) => s.setAddAnchorMode)
  const addAnchor = useStore((s) => s.addAnchor)
  const imgRef = useRef<HTMLImageElement>(null)

  const onMapClick = (e: ReactMouseEvent) => {
    if (editing && addAnchorMode && imgRef.current) {
      const r = imgRef.current.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      const label = window.prompt('New location name:')
      if (label) {
        const tier = Number(window.prompt('Tier (1-5)?', '3')) || 3
        addAnchor(label, tier, Number(x.toFixed(4)), Number(y.toFixed(4)))
      }
      setAddAnchorMode(false)
      return
    }
    setSelectedEventId(null)
  }

  return (
    <TransformWrapper
      minScale={0.6}
      maxScale={6}
      initialScale={1}
      centerOnInit
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.15 }}
      panning={{ disabled: addAnchorMode }}
    >
      <TransformComponent
        wrapperStyle={{ width: '100%', height: '100%' }}
        contentStyle={{ width: 'auto' }}
      >
        <div
          className={`relative w-fit select-none ${addAnchorMode ? 'cursor-crosshair' : ''}`}
          onClick={onMapClick}
        >
          <img
            ref={imgRef}
            src={MAP_SRC}
            alt="Black Whale cross-section"
            className="block max-w-none rounded-sm"
            draggable={false}
          />

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {items.map((it) => {
              const on = matches(it, query)
              const color = it.placement.faction?.color ?? '#888'
              return (
                <g key={`line-${it.placement.event.id}`} opacity={on ? 0.9 : 0.2}>
                  <line x1={`${it.ax}%`} y1={`${it.ay}%`} x2={`${it.bx}%`} y2={`${it.by}%`} stroke={color} strokeWidth={1.5} />
                  <circle cx={`${it.ax}%`} cy={`${it.ay}%`} r={5} fill="#fff" stroke={color} strokeWidth={2} />
                  <circle cx={`${it.ax}%`} cy={`${it.ay}%`} r={2} fill={color} />
                </g>
              )
            })}
          </svg>

          {items.map((it) => (
            <Callout key={it.placement.event.id} item={it} dim={!matches(it, query)} />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
