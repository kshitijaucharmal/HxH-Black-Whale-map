import type {
  Anchor,
  Chapter,
  Character,
  Dataset,
  Faction,
  GameEvent,
} from '../types'

/** Empty dataset used before the JSON has loaded. */
export const emptyDataset: Dataset = {
  factions: [],
  characters: [],
  anchors: [],
  chapters: [],
  events: [],
}

/**
 * Load the dataset from /public/data at runtime (not bundled), so the in-app
 * editor can rewrite those files on disk without triggering an HMR reload while
 * you work. Chapters are sorted ascending.
 */
export async function fetchDataset(): Promise<Dataset> {
  const files = ['factions', 'characters', 'anchors', 'chapters', 'events'] as const
  const [factions, characters, anchors, chapters, events] = await Promise.all(
    files.map((f) => fetch(`/data/${f}.json`).then((r) => r.json())),
  )
  return {
    factions: factions as Faction[],
    characters: characters as Character[],
    anchors: anchors as Anchor[],
    chapters: (chapters as Chapter[]).slice().sort((a, b) => a.number - b.number),
    events: events as GameEvent[],
  }
}

export interface Index {
  factionsById: Map<string, Faction>
  charactersById: Map<string, Character>
  anchorsById: Map<string, Anchor>
}

export function buildIndex(data: Dataset): Index {
  return {
    factionsById: new Map(data.factions.map((f) => [f.id, f])),
    charactersById: new Map(data.characters.map((c) => [c.id, c])),
    anchorsById: new Map(data.anchors.map((a) => [a.id, a])),
  }
}

/** A resolved event ready to render on the map. */
export interface Placement {
  event: GameEvent
  character: Character
  anchor: Anchor
  faction: Faction | undefined
}

export type ViewMode = 'snapshot' | 'cumulative'

/**
 * Events visible at the chapter with the given index in `data.chapters`.
 * - snapshot: only events logged in that exact chapter.
 * - cumulative: each character's most recent event at or before that chapter.
 *   Never looks past the selected chapter — this is the spoiler guard.
 */
export function getVisibleEvents(
  data: Dataset,
  chapterIndex: number,
  mode: ViewMode,
): Placement[] {
  const { chapters } = data
  if (chapterIndex < 0 || chapterIndex >= chapters.length) return []
  const current = chapters[chapterIndex].number
  const { factionsById, charactersById, anchorsById } = buildIndex(data)

  const resolve = (event: GameEvent): Placement | null => {
    const character = charactersById.get(event.characterId)
    const anchor = anchorsById.get(event.anchorId)
    if (!character || !anchor) return null
    return { event, character, anchor, faction: factionsById.get(character.factionId) }
  }

  if (mode === 'snapshot') {
    return data.events
      .filter((e) => e.chapter === current)
      .map(resolve)
      .filter((p): p is Placement => p !== null)
  }

  const latest = new Map<string, GameEvent>()
  for (const e of data.events) {
    if (e.chapter > current) continue
    const prev = latest.get(e.characterId)
    if (!prev || e.chapter > prev.chapter) latest.set(e.characterId, e)
  }
  return [...latest.values()]
    .map(resolve)
    .filter((p): p is Placement => p !== null)
}

/** Face image src for a placement, or null to render an initials fallback. */
export function faceSrc(p: Placement): string | null {
  return p.event.faceOverride ?? p.character.defaultFace ?? null
}

/**
 * The in-story day/time to display at a chapter index — the most recent chapter
 * at or before it that carries timing data (Togashi doesn't stamp every chapter).
 */
export function effectiveTiming(
  data: Dataset,
  chapterIndex: number,
): { day?: number; time?: string } {
  for (let i = Math.min(chapterIndex, data.chapters.length - 1); i >= 0; i--) {
    const c = data.chapters[i]
    if (c.storyDay != null) return { day: c.storyDay, time: c.storyTimeStart }
  }
  return {}
}

/** Count placements by faction id (for sidebar badges). */
export function countByFaction(placements: Placement[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of placements) {
    counts[p.character.factionId] = (counts[p.character.factionId] ?? 0) + 1
  }
  return counts
}

/** Distinct chapter numbers a character has events in, ascending. */
export function appearances(data: Dataset, characterId: string): number[] {
  const set = new Set<number>()
  for (const e of data.events) if (e.characterId === characterId) set.add(e.chapter)
  return [...set].sort((a, b) => a - b)
}
