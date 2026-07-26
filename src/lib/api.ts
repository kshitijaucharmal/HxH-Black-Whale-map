import type { Dataset } from '../types'

// Client for the dev-only API middleware (see vite.config.ts). These endpoints
// only exist while running `npm run dev`; in a production build they 404.

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`)
  return json as T
}

/** Upload a face image (data URL) for a character; returns its public src path. */
export function uploadFace(characterId: string, filename: string, dataUrl: string) {
  return postJson<{ src: string }>('/api/upload-face', { characterId, filename, dataUrl })
}

/** Write the dataset back to /public/data on disk (no commit). */
export function saveData(data: Dataset) {
  return postJson<{ ok: true }>('/api/save', { data })
}

/** Write the dataset, then branch/commit/push and open a PR. Returns its URL. */
export function proposePR(input: {
  data: Dataset
  title: string
  summary: string
  contributor: string
}) {
  return postJson<{ prUrl: string; branch: string }>('/api/propose', input)
}
