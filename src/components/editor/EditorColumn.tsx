import { useState } from 'react'
import { useStore } from '../../store'
import { proposePR, saveData } from '../../lib/api'
import ProposeDialog from './ProposeDialog'

export default function EditorColumn() {
  const data = useStore((s) => s.data)
  const chapterIndex = useStore((s) => s.chapterIndex)
  const dirty = useStore((s) => s.dirty)
  const markSaved = useStore((s) => s.markSaved)
  const addEvent = useStore((s) => s.addEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const openCharacterEditor = useStore((s) => s.openCharacterEditor)
  const addAnchorMode = useStore((s) => s.addAnchorMode)
  const setAddAnchorMode = useStore((s) => s.setAddAnchorMode)

  const chapter = data.chapters[chapterIndex]
  const [charId, setCharId] = useState('')
  const [anchorId, setAnchorId] = useState('')
  const [note, setNote] = useState('')
  const [hidden, setHidden] = useState(false)
  const [charFilter, setCharFilter] = useState('')
  const [showPropose, setShowPropose] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const chEvents = data.events.filter((e) => e.chapter === chapter?.number)
  const charById = new Map(data.characters.map((c) => [c.id, c]))
  const anchorById = new Map(data.anchors.map((a) => [a.id, a]))
  const filteredChars = data.characters.filter((c) =>
    c.name.toLowerCase().includes(charFilter.toLowerCase()),
  )

  const addPlacement = () => {
    if (!charId || !anchorId) return
    addEvent({
      chapter: chapter.number,
      storyDay: chapter.storyDay,
      storyTime: chapter.storyTimeStart,
      characterId: charId,
      anchorId,
      note: note || undefined,
      hidden: hidden || undefined,
      sourceRef: 'manual',
    })
    setNote('')
    setHidden(false)
  }

  const doSave = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await saveData(data)
      markSaved()
      setMsg('Saved to disk.')
    } catch (e) {
      setMsg('Save failed: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const submitPropose = async (title: string, summary: string, contributor: string) => {
    setBusy(true)
    setMsg(null)
    try {
      const { prUrl } = await proposePR({ data, title, summary, contributor })
      setShowPropose(false)
      setMsg(`PR opened: ${prUrl}`)
      await useStore.getState().loadData() // local main is unchanged; reload it
    } catch (e) {
      setMsg('Propose failed: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-4 py-2.5">
        <div className="text-sm font-bold text-[var(--ink)]">Editor</div>
        <div className="text-[11px] text-[var(--muted)]">Chapter {chapter?.number}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Add placement */}
        <section className="border-b border-[var(--line)] p-4">
          <div className="eyebrow mb-2">Add placement (ch. {chapter?.number})</div>
          <div className="space-y-2">
            <select className="inp" value={charId} onChange={(e) => setCharId(e.target.value)}>
              <option value="">— character —</option>
              {data.characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select className="inp" value={anchorId} onChange={(e) => setAnchorId(e.target.value)}>
              <option value="">— location —</option>
              {data.anchors.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
            <input className="inp" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
              Present under a hidden identity
            </label>
            <button
              onClick={addPlacement}
              disabled={!charId || !anchorId}
              className="w-full rounded-md bg-[var(--accent)] py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              Add to map
            </button>
          </div>
        </section>

        {/* This chapter's placements */}
        <section className="border-b border-[var(--line)] p-4">
          <div className="eyebrow mb-2">In this chapter ({chEvents.length})</div>
          <ul className="space-y-1">
            {chEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-xs">
                <button
                  className="flex-1 truncate text-left text-gray-700 hover:text-[var(--accent)]"
                  onClick={() => setSelectedEventId(e.id)}
                >
                  {charById.get(e.characterId)?.name ?? e.characterId}
                  <span className="text-gray-400"> · {anchorById.get(e.anchorId)?.label ?? e.anchorId}</span>
                </button>
                <button onClick={() => deleteEvent(e.id)} className="text-red-500 hover:text-red-700">✕</button>
              </li>
            ))}
            {chEvents.length === 0 && <li className="text-xs text-gray-400">No placements yet.</li>}
          </ul>
        </section>

        {/* Anchors */}
        <section className="border-b border-[var(--line)] p-4">
          <div className="eyebrow mb-2">Locations</div>
          <button
            onClick={() => setAddAnchorMode(!addAnchorMode)}
            className={`w-full rounded-md border px-3 py-1.5 text-sm font-medium ${
              addAnchorMode ? 'border-[var(--accent)] bg-orange-50 text-[var(--accent)]' : 'border-[var(--line)] text-gray-700 hover:bg-[#f2f3f6]'
            }`}
          >
            {addAnchorMode ? 'Click the map to place…' : '＋ Add location (click map)'}
          </button>
        </section>

        {/* Characters */}
        <section className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Characters</span>
            <button onClick={() => openCharacterEditor('new')} className="text-xs font-semibold text-[var(--accent)] hover:underline">＋ New</button>
          </div>
          <input className="inp mb-2" placeholder="Filter…" value={charFilter} onChange={(e) => setCharFilter(e.target.value)} />
          <ul className="max-h-52 space-y-0.5 overflow-y-auto">
            {filteredChars.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => openCharacterEditor(c.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-[#f2f3f6]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef0f3] text-[9px] text-gray-500">
                    {c.defaultFace ? <img src={c.defaultFace} alt="" className="h-full w-full object-cover" /> : c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate text-gray-700">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Save / propose bar */}
      <div className="border-t border-[var(--line)] p-3">
        {msg && <div className="mb-2 max-h-16 overflow-y-auto text-[11px] break-words text-gray-600">{msg}</div>}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dirty ? 'bg-[var(--accent)]' : 'bg-gray-300'}`} title={dirty ? 'Unsaved changes' : 'No changes'} />
          <button
            onClick={doSave}
            disabled={busy || !dirty}
            className="flex-1 rounded-md border border-[var(--line)] py-1.5 text-sm font-medium text-gray-700 hover:bg-[#f2f3f6] disabled:opacity-40"
          >
            Save to disk
          </button>
          <button
            onClick={() => setShowPropose(true)}
            disabled={busy}
            className="flex-1 rounded-md bg-[var(--ink)] py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            Propose PR
          </button>
        </div>
      </div>

      {showPropose && (
        <ProposeDialog busy={busy} onCancel={() => setShowPropose(false)} onSubmit={submitPropose} />
      )}
    </aside>
  )
}
