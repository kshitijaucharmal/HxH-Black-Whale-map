import { useState, type ReactNode } from 'react'
import type { Character, LifeStatus } from '../types'
import { appearances } from '../lib/data'
import { useIndex } from '../lib/hooks'
import { useStore } from '../store'
import { uploadFace, saveData, proposePR } from '../lib/api'
import ProposeDialog from './editor/ProposeDialog'
import { Close, External, Plus, Pin, Trash, Upload } from './icons'

const STATUS_LABEL: Record<string, string> = { alive: 'Alive', deceased: 'Deceased', unknown: 'Unknown' }

export default function Inspector() {
  const data = useStore((s) => s.data)
  const editing = useStore((s) => s.editing)
  const chapterIndex = useStore((s) => s.chapterIndex)
  const selectedEventId = useStore((s) => s.selectedEventId)
  const selectedCharacterId = useStore((s) => s.selectedCharacterId)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const setSelectedCharacterId = useStore((s) => s.setSelectedCharacterId)
  const setChapterIndex = useStore((s) => s.setChapterIndex)
  const { charactersById, factionsById } = useIndex()

  const event = selectedEventId ? data.events.find((e) => e.id === selectedEventId) : undefined
  const character: Character | undefined = event
    ? charactersById.get(event.characterId)
    : selectedCharacterId
      ? charactersById.get(selectedCharacterId)
      : undefined
  const faction = character ? factionsById.get(character.factionId) : undefined
  const color = faction?.color ?? '#9aa0a6'
  const chapter = data.chapters[chapterIndex]

  const clear = () => {
    setSelectedEventId(null)
    setSelectedCharacterId(null)
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]">
      {character ? (
        <>
          <Header character={character} color={color} factionName={faction?.name} onClose={clear} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {editing ? (
              <EditFields character={character} />
            ) : (
              <ViewFields character={character} />
            )}

            {/* Placement context */}
            {event ? (
              <PlacementBlock eventId={event.id} editing={editing} />
            ) : editing ? (
              <QuickPlace characterId={character.id} chapterNumber={chapter?.number} />
            ) : null}

            {/* Appearances */}
            <Appearances characterId={character.id} currentChapter={event?.chapter} onJump={setChapterIndex} />

            {character.wikiUrl && (
              <div className="px-4 pb-4">
                <a href={character.wikiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline">
                  Fandom wiki <External width={13} height={13} />
                </a>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState editing={editing} />
      )}

      {editing && <EditorFooter />}
    </aside>
  )
}

/* ------------------------------------------------------------------ header */
function Header({ character, color, factionName, onClose }: { character: Character; color: string; factionName?: string; onClose: () => void }) {
  const editing = useStore((s) => s.editing)
  const updateCharacter = useStore((s) => s.updateCharacter)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File) => {
    setBusy(true)
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result as string)
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const { src } = await uploadFace(character.id, `face-${Math.floor(performance.now())}.${ext}`, dataUrl)
      updateCharacter(character.id, { defaultFace: src })
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-4" style={{ boxShadow: `inset 0 3px 0 ${color}` }}>
      <div className="relative">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg text-sm font-bold text-white" style={{ background: color }}>
          {character.defaultFace ? (
            <img src={character.defaultFace} alt={character.name} className="h-full w-full object-cover" />
          ) : (
            character.name.slice(0, 2).toUpperCase()
          )}
        </div>
        {editing && (
          <label className="absolute -right-1.5 -bottom-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-white text-gray-600 shadow-sm hover:text-[var(--accent)]" title="Upload face image">
            {busy ? <span className="text-[9px]">…</span> : <Upload width={13} height={13} />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="truncate text-[15px] leading-tight font-bold text-[var(--ink)]">{character.name}</div>
        {factionName && <div className="mt-0.5 text-xs font-medium" style={{ color }}>{factionName}</div>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><Close /></button>
    </div>
  )
}

/* -------------------------------------------------------------- view mode */
function ViewFields({ character }: { character: Character }) {
  return (
    <div className="px-4 py-4">
      {character.bio && <p className="mb-3 text-[13px] leading-relaxed text-gray-600">{character.bio}</p>}
      <dl className="space-y-2 text-xs">
        <Row label="Species" value={character.species} />
        <Row label="Nen type" value={character.nenType} />
        <Row label="Affiliation" value={character.affiliation} />
        <Row label="Status" value={character.status ? STATUS_LABEL[character.status] : undefined} />
        {character.aliases?.length ? <Row label="Aliases" value={character.aliases.join(', ')} /> : null}
      </dl>
    </div>
  )
}

/* -------------------------------------------------------------- edit mode */
function EditFields({ character }: { character: Character }) {
  const factions = useStore((s) => s.data.factions)
  const updateCharacter = useStore((s) => s.updateCharacter)
  const deleteCharacter = useStore((s) => s.deleteCharacter)
  const set = <K extends keyof Character>(k: K, v: Character[K]) => updateCharacter(character.id, { [k]: v })

  return (
    <div className="space-y-3 px-4 py-4">
      <L label="Name"><input className="inp" value={character.name} onChange={(e) => set('name', e.target.value)} /></L>
      <L label="Faction">
        <select className="inp" value={character.factionId} onChange={(e) => set('factionId', e.target.value)}>
          <option value="">— pick —</option>
          {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </L>
      <div className="grid grid-cols-2 gap-3">
        <L label="Species"><input className="inp" value={character.species ?? ''} onChange={(e) => set('species', e.target.value)} /></L>
        <L label="Nen type"><input className="inp" value={character.nenType ?? ''} onChange={(e) => set('nenType', e.target.value)} /></L>
      </div>
      <L label="Affiliation"><input className="inp" value={character.affiliation ?? ''} onChange={(e) => set('affiliation', e.target.value)} /></L>
      <div className="grid grid-cols-2 gap-3">
        <L label="Status">
          <select className="inp" value={character.status ?? 'unknown'} onChange={(e) => set('status', e.target.value as LifeStatus)}>
            <option value="alive">Alive</option>
            <option value="deceased">Deceased</option>
            <option value="unknown">Unknown</option>
          </select>
        </L>
        <L label="Aliases (comma)">
          <input className="inp" value={character.aliases?.join(', ') ?? ''} onChange={(e) => set('aliases', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
        </L>
      </div>
      <L label="Bio"><textarea className="inp h-20" value={character.bio ?? ''} onChange={(e) => set('bio', e.target.value)} /></L>
      <L label="Fandom wiki URL"><input className="inp" value={character.wikiUrl ?? ''} onChange={(e) => set('wikiUrl', e.target.value)} /></L>
      <button
        onClick={() => { if (confirm(`Delete ${character.name} and all their placements?`)) deleteCharacter(character.id) }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
      >
        <Trash width={13} height={13} /> Delete character
      </button>
    </div>
  )
}

/* ------------------------------------------------------ placement blocks */
function PlacementBlock({ eventId, editing }: { eventId: string; editing: boolean }) {
  const data = useStore((s) => s.data)
  const anchors = data.anchors
  const updateEvent = useStore((s) => s.updateEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const { anchorsById } = useIndex()
  const event = data.events.find((e) => e.id === eventId)
  if (!event) return null
  const anchor = anchorsById.get(event.anchorId)

  if (!editing) {
    return (
      <div className="border-t border-[var(--line)] px-4 py-4">
        <div className="eyebrow mb-2">In chapter {event.chapter}</div>
        <dl className="space-y-2 text-xs">
          <Row label="Location" value={anchor ? `${anchor.label} · Tier ${anchor.tier}` : undefined} />
          <Row label="Story time" value={event.storyDay ? `Day ${event.storyDay}${event.storyTime ? ` · ${event.storyTime}` : ''}` : undefined} />
          {event.hidden && <Row label="Status" value="Hidden / disguised" />}
          {event.note && <Row label="Note" value={event.note} />}
          <Row label="Source" value={event.sourceRef} />
        </dl>
      </div>
    )
  }

  return (
    <div className="border-t border-[var(--line)] px-4 py-4">
      <div className="eyebrow mb-2">Placement · chapter {event.chapter}</div>
      <div className="space-y-3">
        <L label="Location">
          <select className="inp" value={event.anchorId} onChange={(e) => updateEvent(event.id, { anchorId: e.target.value })}>
            {anchors.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </L>
        <L label="Note"><input className="inp" value={event.note ?? ''} onChange={(e) => updateEvent(event.id, { note: e.target.value || undefined })} /></L>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={!!event.hidden} onChange={(e) => updateEvent(event.id, { hidden: e.target.checked || undefined })} />
          Hidden / disguised here
        </label>
        <button onClick={() => deleteEvent(event.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700">
          <Trash width={13} height={13} /> Remove from chapter {event.chapter}
        </button>
      </div>
    </div>
  )
}

function QuickPlace({ characterId, chapterNumber }: { characterId: string; chapterNumber?: number }) {
  const data = useStore((s) => s.data)
  const addEvent = useStore((s) => s.addEvent)
  const setSelectedEventId = useStore((s) => s.setSelectedEventId)
  const chapter = data.chapters.find((c) => c.number === chapterNumber)
  const [anchorId, setAnchorId] = useState('')

  return (
    <div className="border-t border-[var(--line)] px-4 py-4">
      <div className="eyebrow mb-2">Place in chapter {chapterNumber}</div>
      <div className="flex gap-2">
        <select className="inp" value={anchorId} onChange={(e) => setAnchorId(e.target.value)}>
          <option value="">— location —</option>
          {data.anchors.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <button
          className="btn btn-primary shrink-0"
          disabled={!anchorId || !chapter}
          onClick={() => {
            const id = addEvent({ chapter: chapter!.number, storyDay: chapter!.storyDay, storyTime: chapter!.storyTimeStart, characterId, anchorId, sourceRef: 'manual' })
            setSelectedEventId(id)
          }}
        >
          <Plus width={14} height={14} /> Add
        </button>
      </div>
    </div>
  )
}

function Appearances({ characterId, currentChapter, onJump }: { characterId: string; currentChapter?: number; onJump: (i: number) => void }) {
  const data = useStore((s) => s.data)
  const list = appearances(data, characterId)
  if (!list.length) return null
  return (
    <div className="border-t border-[var(--line)] px-4 py-4">
      <div className="eyebrow mb-2">Logged appearances · {list.length}</div>
      <div className="flex flex-wrap gap-1">
        {list.map((num) => {
          const idx = data.chapters.findIndex((c) => c.number === num)
          return (
            <button key={num} onClick={() => idx >= 0 && onJump(idx)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${num === currentChapter ? 'bg-[var(--accent)] text-white' : 'bg-[#f0eee9] text-gray-600 hover:bg-[#e6e3dc]'}`}>
              {num}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- empty/foot */
function EmptyState({ editing }: { editing: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        {editing
          ? 'Select a marker to edit it, or use New character / Add location below.'
          : 'Click a character on the map to see their details, story position, and appearances.'}
      </p>
    </div>
  )
}

function EditorFooter() {
  const data = useStore((s) => s.data)
  const dirty = useStore((s) => s.dirty)
  const markSaved = useStore((s) => s.markSaved)
  const createCharacter = useStore((s) => s.createCharacter)
  const addAnchorMode = useStore((s) => s.addAnchorMode)
  const setAddAnchorMode = useStore((s) => s.setAddAnchorMode)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showPropose, setShowPropose] = useState(false)

  const doSave = async () => {
    setBusy(true); setMsg(null)
    try { await saveData(data); markSaved(); setMsg('Saved to disk.') }
    catch (e) { setMsg('Save failed: ' + (e as Error).message) }
    finally { setBusy(false) }
  }
  const submit = async (title: string, summary: string, contributor: string) => {
    setBusy(true); setMsg(null)
    try {
      const { prUrl } = await proposePR({ data, title, summary, contributor })
      setShowPropose(false); setMsg(`PR opened: ${prUrl}`)
      await useStore.getState().loadData()
    } catch (e) { setMsg('Propose failed: ' + (e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="border-t border-[var(--line)] bg-[#faf9f6] p-3">
      <div className="mb-2 flex gap-2">
        <button onClick={() => createCharacter()} className="btn btn-ghost flex-1"><Plus width={13} height={13} /> Character</button>
        <button onClick={() => setAddAnchorMode(!addAnchorMode)} className={`btn flex-1 ${addAnchorMode ? 'btn-primary' : 'btn-ghost'}`}><Pin width={13} height={13} /> Location</button>
      </div>
      {msg && <div className="mb-2 max-h-16 overflow-y-auto rounded bg-white px-2 py-1.5 text-[11px] break-words text-gray-600 ring-1 ring-[var(--line)]">{msg}</div>}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dirty ? 'bg-[var(--accent)]' : 'bg-gray-300'}`} title={dirty ? 'Unsaved changes' : 'No changes'} />
        <button onClick={doSave} disabled={busy || !dirty} className="btn btn-ghost flex-1">Save to disk</button>
        <button onClick={() => setShowPropose(true)} disabled={busy} className="btn btn-dark flex-1">Propose PR</button>
      </div>
      {showPropose && <ProposeDialog busy={busy} onCancel={() => setShowPropose(false)} onSubmit={submit} />}
    </div>
  )
}

/* ---------------------------------------------------------------- atoms */
function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-medium text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}
function L({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1 block">{label}</span>
      {children}
    </label>
  )
}
