import { useMemo, useState, type ReactNode } from 'react'
import type { Character, LifeStatus } from '../../types'
import { uploadFace } from '../../lib/api'
import { useStore } from '../../store'

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const BLANK: Character = { id: '', name: '', factionId: '', status: 'alive', species: 'Human' }

export default function CharacterEditor() {
  const target = useStore((s) => s.editingCharacterId)
  const close = () => useStore.getState().openCharacterEditor(null)
  const factions = useStore((s) => s.data.factions)
  const characters = useStore((s) => s.data.characters)
  const upsertCharacter = useStore((s) => s.upsertCharacter)

  const existing = useMemo(
    () => (target && target !== 'new' ? characters.find((c) => c.id === target) : undefined),
    [target, characters],
  )
  const [form, setForm] = useState<Character>(existing ?? BLANK)
  const [uploading, setUploading] = useState(false)

  if (!target) return null

  const set = <K extends keyof Character>(k: K, v: Character[K]) => setForm((f) => ({ ...f, [k]: v }))
  const derivedId = existing ? existing.id : slugify(form.name)

  const onFile = async (file: File) => {
    if (!derivedId) return alert('Enter a name first (used as the id / folder).')
    setUploading(true)
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result as string)
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const { src } = await uploadFace(derivedId, `face.${ext}`, dataUrl)
      set('defaultFace', `${src}?t=${Math.floor(performance.now())}`)
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const save = () => {
    if (!form.name.trim()) return alert('Name is required.')
    if (!form.factionId) return alert('Pick a faction.')
    const clean = form.defaultFace?.split('?')[0]
    upsertCharacter({ ...form, id: derivedId, defaultFace: clean })
    close()
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={close}>
      <div
        className="max-h-full w-[30rem] overflow-y-auto rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            {existing ? `Edit ${existing.name}` : 'New character'}
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-[#eef0f3] text-xs text-gray-400">
              {form.defaultFace ? (
                <img src={form.defaultFace} alt="" className="h-full w-full object-cover" />
              ) : (
                'no image'
              )}
            </div>
            <label className="cursor-pointer rounded-md border border-[var(--line)] px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#f2f3f6]">
              {uploading ? 'Uploading…' : 'Upload face image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
          </div>

          <Field label="Name">
            <input className="inp" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Aliases (comma-separated)">
            <input
              className="inp"
              value={form.aliases?.join(', ') ?? ''}
              onChange={(e) => set('aliases', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Faction">
            <select className="inp" value={form.factionId} onChange={(e) => set('factionId', e.target.value)}>
              <option value="">— pick —</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Species">
              <input className="inp" value={form.species ?? ''} onChange={(e) => set('species', e.target.value)} />
            </Field>
            <Field label="Nen type">
              <input className="inp" value={form.nenType ?? ''} onChange={(e) => set('nenType', e.target.value)} />
            </Field>
          </div>
          <Field label="Affiliation">
            <input className="inp" value={form.affiliation ?? ''} onChange={(e) => set('affiliation', e.target.value)} />
          </Field>
          <Field label="Status">
            <select className="inp" value={form.status ?? 'unknown'} onChange={(e) => set('status', e.target.value as LifeStatus)}>
              <option value="alive">Alive</option>
              <option value="deceased">Deceased</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Bio">
            <textarea className="inp h-20 resize-none" value={form.bio ?? ''} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <Field label="Fandom wiki URL">
            <input className="inp" value={form.wikiUrl ?? ''} onChange={(e) => set('wikiUrl', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button onClick={close} className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-[#f2f3f6]">Cancel</button>
          <button onClick={save} className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1 block">{label}</span>
      {children}
    </label>
  )
}
