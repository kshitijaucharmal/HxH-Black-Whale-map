import { useState } from 'react'

export default function ProposeDialog({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean
  onCancel: () => void
  onSubmit: (title: string, summary: string, contributor: string) => void
}) {
  const [title, setTitle] = useState('Update Black Whale map data')
  const [summary, setSummary] = useState('')
  const [contributor, setContributor] = useState('')

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-[26rem] rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Propose changes as a Pull Request</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Creates a branch, commits your edits, pushes, and opens a PR for review. Your local
            <b> main</b> stays unchanged until it's merged.
          </p>
        </div>
        <div className="space-y-3 p-4">
          <label className="block">
            <span className="eyebrow mb-1 block">PR title</span>
            <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="eyebrow mb-1 block">Summary (what & why)</span>
            <textarea className="inp h-20 resize-none" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label className="block">
            <span className="eyebrow mb-1 block">Your name / handle</span>
            <input className="inp" placeholder="anonymous" value={contributor} onChange={(e) => setContributor(e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-4 py-3">
          <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-[#f2f3f6]">Cancel</button>
          <button
            onClick={() => onSubmit(title, summary, contributor)}
            disabled={busy || !title.trim()}
            className="rounded-md bg-[var(--ink)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Opening PR…' : 'Open PR'}
          </button>
        </div>
      </div>
    </div>
  )
}
