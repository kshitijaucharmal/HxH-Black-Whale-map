import { create } from 'zustand'
import { emptyDataset, fetchDataset, type ViewMode } from './lib/data'
import type { Anchor, Character, Dataset, GameEvent } from './types'

export type TimelineMode = 'chapter' | 'time'

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(performance.now()).toString(36)
  return `${prefix}-${rand}`
}

interface AppState {
  // Data ------------------------------------------------------------------
  data: Dataset
  loaded: boolean
  dirty: boolean
  loadData: () => Promise<void>
  markSaved: () => void

  // Timeline / view -------------------------------------------------------
  chapterIndex: number
  setChapterIndex: (i: number) => void
  timelineMode: TimelineMode
  setTimelineMode: (m: TimelineMode) => void
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
  playing: boolean
  setPlaying: (p: boolean) => void

  // Selection / filters ---------------------------------------------------
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void
  hiddenFactions: Set<string>
  toggleFaction: (id: string) => void
  hiddenTiers: Set<number>
  toggleTier: (t: number) => void
  query: string
  setQuery: (q: string) => void

  // Editor ----------------------------------------------------------------
  editing: boolean
  setEditing: (e: boolean) => void
  editingCharacterId: string | null | 'new'
  openCharacterEditor: (id: string | null | 'new') => void
  addAnchorMode: boolean
  setAddAnchorMode: (v: boolean) => void

  upsertCharacter: (c: Character) => void
  addAnchor: (label: string, tier: number, x: number, y: number) => Anchor
  addEvent: (e: Omit<GameEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<GameEvent>) => void
  deleteEvent: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  data: emptyDataset,
  loaded: false,
  dirty: false,
  loadData: async () => {
    const data = await fetchDataset()
    set({ data, loaded: true, dirty: false, chapterIndex: Math.max(0, data.chapters.length - 1) })
  },
  markSaved: () => set({ dirty: false }),

  chapterIndex: 0,
  setChapterIndex: (i) => set({ chapterIndex: i }),
  timelineMode: 'chapter',
  setTimelineMode: (m) => set({ timelineMode: m }),
  viewMode: 'cumulative',
  setViewMode: (m) => set({ viewMode: m, selectedEventId: null }),
  playing: false,
  setPlaying: (p) => set({ playing: p }),

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  hiddenFactions: new Set<string>(),
  toggleFaction: (id) =>
    set((s) => {
      const next = new Set(s.hiddenFactions)
      next.has(id) ? next.delete(id) : next.add(id)
      return { hiddenFactions: next }
    }),
  hiddenTiers: new Set<number>(),
  toggleTier: (t) =>
    set((s) => {
      const next = new Set(s.hiddenTiers)
      next.has(t) ? next.delete(t) : next.add(t)
      return { hiddenTiers: next }
    }),
  query: '',
  setQuery: (q) => set({ query: q }),

  editing: false,
  setEditing: (e) => set({ editing: e, addAnchorMode: false }),
  editingCharacterId: null,
  openCharacterEditor: (id) => set({ editingCharacterId: id }),
  addAnchorMode: false,
  setAddAnchorMode: (v) => set({ addAnchorMode: v }),

  upsertCharacter: (c) =>
    set((s) => {
      const exists = s.data.characters.some((x) => x.id === c.id)
      const characters = exists
        ? s.data.characters.map((x) => (x.id === c.id ? c : x))
        : [...s.data.characters, c]
      return { data: { ...s.data, characters }, dirty: true }
    }),

  addAnchor: (label, tier, x, y) => {
    const anchor: Anchor = { id: uid('a'), label, tier, x, y }
    set((s) => ({ data: { ...s.data, anchors: [...s.data.anchors, anchor] }, dirty: true }))
    return anchor
  },

  addEvent: (e) =>
    set((s) => ({
      data: { ...s.data, events: [...s.data.events, { ...e, id: uid('e') }] },
      dirty: true,
    })),

  updateEvent: (id, patch) =>
    set((s) => ({
      data: {
        ...s.data,
        events: s.data.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
      dirty: true,
    })),

  deleteEvent: (id) =>
    set((s) => ({
      data: { ...s.data, events: s.data.events.filter((e) => e.id !== id) },
      dirty: true,
    })),
}))

// Convenience selector for the current chapter number.
export const currentChapterNumber = () => {
  const s = useStore.getState()
  return s.data.chapters[s.chapterIndex]?.number
}
