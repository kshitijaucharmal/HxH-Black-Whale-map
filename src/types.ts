// Shared data model for the Black Whale Tracker.
// The whole app is a query over `Event[]` filtered to a point on the timeline.

export interface Faction {
  id: string
  name: string
  /** CSS color used for the callout border + legend swatch. */
  color: string
}

export type LifeStatus = 'alive' | 'deceased' | 'unknown'

export interface Character {
  id: string
  name: string
  aliases?: string[]
  factionId: string
  /** Path to a cropped face PNG under /public/faces. Optional — falls back to initials. */
  defaultFace?: string
  species?: string
  nenType?: string
  affiliation?: string
  status?: LifeStatus
  bio?: string
  /** Link to the character's page on the HxH fandom wiki. */
  wikiUrl?: string
  notes?: string
}

/** A named location on the ship. `x`/`y` are normalized 0..1 targets on the base map. */
export interface Anchor {
  id: string
  label: string
  tier: number
  x: number
  y: number
}

export interface Chapter {
  number: number
  title?: string
  /** In-story day count (Togashi timestamps scenes; e.g. voyage day 1, 2, ...). */
  storyDay?: number
  /** In-story clock time, "HH:MM" 24h, marking when the chapter's events begin. */
  storyTimeStart?: string
  arc?: string
}

/** One fact: a character was at an anchor at a given point in the story. */
export interface GameEvent {
  id: string
  chapter: number
  storyDay?: number
  /** "HH:MM" 24h. */
  storyTime?: string
  characterId: string
  anchorId: string
  /** Optional per-scene face crop overriding the character's default. */
  faceOverride?: string
  /** Preferred side for the callout box relative to its anchor. */
  calloutSide?: 'left' | 'right'
  note?: string
  /** Where in the manga this is sourced from, e.g. "ch. 380 p.12". */
  sourceRef?: string
  /**
   * True if the character is present under a disguise / hidden identity.
   * When set, `apparentCharacterId` names who they appear to be.
   */
  hidden?: boolean
  apparentCharacterId?: string
  /** GitHub handle of the contributor who logged this (populated in later phases). */
  contributor?: string
}

export interface Dataset {
  factions: Faction[]
  characters: Character[]
  anchors: Anchor[]
  chapters: Chapter[]
  events: GameEvent[]
}
