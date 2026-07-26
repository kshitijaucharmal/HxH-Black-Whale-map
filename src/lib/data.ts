import type {
  Anchor,
  Chapter,
  Character,
  Dataset,
  Faction,
  GameEvent,
} from '../types'

import factionsRaw from '../../data/factions.json'
import charactersRaw from '../../data/characters.json'
import anchorsRaw from '../../data/anchors.json'
import chaptersRaw from '../../data/chapters.json'
import eventsRaw from '../../data/events.json'

export const dataset: Dataset = {
  factions: factionsRaw as Faction[],
  characters: charactersRaw as Character[],
  anchors: anchorsRaw as Anchor[],
  chapters: (chaptersRaw as Chapter[]).slice().sort((a, b) => a.number - b.number),
  events: eventsRaw as GameEvent[],
}

// Lookup maps -------------------------------------------------------------
export const factionsById = new Map(dataset.factions.map((f) => [f.id, f]))
export const charactersById = new Map(dataset.characters.map((c) => [c.id, c]))
export const anchorsById = new Map(dataset.anchors.map((a) => [a.id, a]))

/** A resolved event ready to render on the map. */
export interface Placement {
  event: GameEvent
  character: Character
  anchor: Anchor
  faction: Faction | undefined
}

export type ViewMode = 'snapshot' | 'cumulative'

function resolve(event: GameEvent): Placement | null {
  const character = charactersById.get(event.characterId)
  const anchor = anchorsById.get(event.anchorId)
  if (!character || !anchor) return null
  return { event, character, anchor, faction: factionsById.get(character.factionId) }
}

/**
 * Events visible at the chapter with the given index in `dataset.chapters`.
 * - snapshot: only events logged in that exact chapter.
 * - cumulative: each character's most recent event at or before that chapter
 *   (last-known position). Never looks past the selected chapter — this is the
 *   spoiler guard.
 */
export function getVisibleEvents(chapterIndex: number, mode: ViewMode): Placement[] {
  const chapters = dataset.chapters
  if (chapterIndex < 0 || chapterIndex >= chapters.length) return []
  const current = chapters[chapterIndex].number

  if (mode === 'snapshot') {
    return dataset.events
      .filter((e) => e.chapter === current)
      .map(resolve)
      .filter((p): p is Placement => p !== null)
  }

  // Cumulative: latest event per character with chapter <= current.
  const latest = new Map<string, GameEvent>()
  for (const e of dataset.events) {
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
export function effectiveTiming(chapterIndex: number): { day?: number; time?: string } {
  for (let i = Math.min(chapterIndex, dataset.chapters.length - 1); i >= 0; i--) {
    const c = dataset.chapters[i]
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
