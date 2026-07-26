import { create } from 'zustand'
import { dataset, type ViewMode } from './lib/data'

export type TimelineMode = 'chapter' | 'time'

interface AppState {
  /** Index into dataset.chapters (sorted ascending). */
  chapterIndex: number
  setChapterIndex: (i: number) => void

  /** Whether the timeline reads by chapter number or by story day/time. */
  timelineMode: TimelineMode
  setTimelineMode: (m: TimelineMode) => void

  /** snapshot = present in this chapter; cumulative = last-known positions. */
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void

  /** Auto-advance the timeline. */
  playing: boolean
  setPlaying: (p: boolean) => void

  /** Event whose detail panel is open, or null. */
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void

  /** Faction ids hidden via the sidebar. */
  hiddenFactions: Set<string>
  toggleFaction: (id: string) => void

  /** Tiers hidden via the sidebar. */
  hiddenTiers: Set<number>
  toggleTier: (t: number) => void

  /** Name search; non-matching callouts dim. */
  query: string
  setQuery: (q: string) => void
}

export const useStore = create<AppState>((set) => ({
  chapterIndex: dataset.chapters.length - 1,
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
}))
