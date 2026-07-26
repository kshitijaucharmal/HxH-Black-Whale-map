# Black Whale Tracker

An interactive map + timeline of the **Hunter × Hunter** Succession Contest arc. It
reproduces Togashi's cross-section of the Black Whale ship and shows, for any point in the
story, which characters were present and where — as manga-style callouts (cropped face +
location label + a leader line to a spot on the ship). Scrub the timeline by chapter or by
in-story day/time.

Open source and community-fixable: all data lives as plain JSON in `/data`, so corrections
and additions can be made by editing files and opening a Pull Request.

## Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Project layout

```
data/              the source of truth — edit these to fix/add facts
  factions.json    groups + their callout colors
  characters.json  people + which faction they belong to
  anchors.json     named locations on the ship, with normalized x/y (0..1) map targets
  chapters.json    timeline points (chapter number, in-story day/time)
  events.json      the fact table: "character X at anchor Y in chapter Z"
public/
  map/black-whale.png   base cross-section image (replace with a clean high-res version)
  faces/<characterId>/  cropped face PNGs (optional; falls back to initials)
src/
  components/      MapCanvas, Callout, Timeline, DetailPanel, FactionLegend
  lib/             data loading, timeline filtering, callout layout
  store.ts         UI state (timeline position, view mode, legend toggles)
  types.ts         the data model
```

## How the timeline works

- **This chapter (snapshot):** only events logged in the selected chapter.
- **Last known (cumulative):** each character's most recent position at or before the
  selected chapter. Nothing past the selected point is ever shown — this doubles as a
  spoiler guard.

## Status

Phase 1 (viewer + sample data) — working. The base map is Togashi's empty tier
cross-section; the current dataset is **illustrative** (anchor positions and story day/time
estimated, not sourced). Replace with real, sourced data as chapters are logged. Phases 2
(in-app crop/place authoring tool) and 3 (submit edits as GitHub PRs) are planned next.

UI: light, map-first layout (dark top bar, left filter rail, bottom timeline transport)
inspired by interactive game-map sites. Timeline scrubs across the full arc (ch. 349–415)
with play/step controls; "Last known" mode carries each character's most recent position so
the map stays populated as you scrub.

## Contributing

Edit the JSON in `/data` (and add face crops under `public/faces/<characterId>/`) and open
a PR. Each event should carry a `sourceRef` (e.g. `"ch. 380 p.12"`) so facts can be checked.
