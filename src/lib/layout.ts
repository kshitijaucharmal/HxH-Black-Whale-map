import type { Placement } from './data'

export interface LaidOutCallout {
  placement: Placement
  /** Anchor point on the map, in percent (0..100). Leader line ends here. */
  ax: number
  ay: number
  /** Callout box connect point, in percent. Leader line starts here. */
  bx: number
  by: number
  side: 'left' | 'right'
}

const STEP = 9 // vertical spacing between stacked callouts sharing an anchor (%)
const OFFSET = 7 // horizontal distance from anchor to box connect point (%)

/**
 * Position callout boxes around their anchors. Multiple characters at the same
 * anchor are stacked vertically and centered on it. Side defaults from the
 * event, otherwise from which half of the ship the anchor sits in.
 */
export function layoutCallouts(placements: Placement[]): LaidOutCallout[] {
  const groups = new Map<string, Placement[]>()
  for (const p of placements) {
    const list = groups.get(p.anchor.id) ?? []
    list.push(p)
    groups.set(p.anchor.id, list)
  }

  const out: LaidOutCallout[] = []
  for (const [, list] of groups) {
    const n = list.length
    list.forEach((placement, i) => {
      const { anchor } = placement
      const ax = anchor.x * 100
      const ay = anchor.y * 100
      const side: 'left' | 'right' =
        placement.event.calloutSide ?? (anchor.x > 0.5 ? 'right' : 'left')
      const dy = (i - (n - 1) / 2) * STEP
      const bx = ax + (side === 'right' ? OFFSET : -OFFSET)
      const by = ay + dy
      out.push({ placement, ax, ay, bx, by, side })
    })
  }
  return out
}
