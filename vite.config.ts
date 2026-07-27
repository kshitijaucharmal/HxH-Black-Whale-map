import { defineConfig, type Plugin, type Connect } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { promises as fs } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ServerResponse } from 'node:http'

const run = promisify(execFile)
const DATA_KEYS = ['factions', 'characters', 'anchors', 'chapters', 'events'] as const

function readBody(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function safe(name: string): string {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function writeDataset(root: string, data: Record<string, unknown>) {
  const dir = path.join(root, 'public', 'data')
  for (const key of DATA_KEYS) {
    if (data[key] == null) continue
    await fs.writeFile(
      path.join(dir, `${key}.json`),
      JSON.stringify(data[key], null, 2) + '\n',
      'utf8',
    )
  }
}

async function repoSlug(root: string): Promise<string> {
  const { stdout } = await run('git', ['remote', 'get-url', 'origin'], { cwd: root })
  const m = stdout.trim().match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/)
  if (!m) throw new Error('Could not parse owner/repo from origin remote')
  return `${m[1]}/${m[2]}`
}

/** Dev-only endpoints for the in-app editor: persist data, upload faces, open PRs. */
function editorApi(): Plugin {
  return {
    name: 'black-whale-editor-api',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root

      const IMG_TYPES: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      }

      server.middlewares.use(async (req, res, next) => {
        // Serve uploaded face images ourselves (Vite's public serving doesn't
        // reliably pick up files created during the session).
        if (req.method === 'GET' && req.url?.startsWith('/faces/')) {
          const clean = decodeURIComponent(req.url.split('?')[0])
          if (clean.includes('..')) return next()
          const fp = path.join(root, 'public', clean)
          if (!existsSync(fp)) return next()
          const ext = path.extname(fp).slice(1).toLowerCase()
          res.setHeader('Content-Type', IMG_TYPES[ext] ?? 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(await fs.readFile(fp))
          return
        }

        if (!req.url?.startsWith('/api/') || req.method !== 'POST') return next()
        try {
          // ---- upload a face image -------------------------------------
          if (req.url.startsWith('/api/upload-face')) {
            const { characterId, filename, dataUrl } = await readBody(req)
            const b64 = String(dataUrl).split(',')[1] ?? ''
            const dir = path.join(root, 'public', 'faces', safe(characterId))
            await fs.mkdir(dir, { recursive: true })
            const file = safe(filename || 'face.png')
            await fs.writeFile(path.join(dir, file), Buffer.from(b64, 'base64'))
            return send(res, 200, { src: `/faces/${safe(characterId)}/${file}` })
          }

          // ---- save dataset to disk ------------------------------------
          if (req.url.startsWith('/api/save')) {
            const { data } = await readBody(req)
            await writeDataset(root, data)
            return send(res, 200, { ok: true })
          }

          // ---- write + open a Pull Request -----------------------------
          if (req.url.startsWith('/api/propose')) {
            const { data, title, summary, contributor } = await readBody(req)
            await writeDataset(root, data)

            const git = (args: string[]) => run('git', args, { cwd: root })
            const branch = `contrib/edit-${Date.now()}`
            const body = `${summary || 'Edited via the in-app map editor.'}\n\nContributor: ${contributor || 'anonymous'}`
            try {
              await git(['checkout', '-b', branch])
              const paths = ['public/data']
              if (existsSync(path.join(root, 'public/faces'))) paths.push('public/faces')
              await git(['add', ...paths])
              await git(['commit', '-m', title || 'Update Black Whale map data', '-m', body])
              await git(['push', '-u', 'origin', branch])
              const slug = await repoSlug(root)
              const { stdout } = await run(
                'gh',
                ['pr', 'create', '-R', slug, '--base', 'main', '--head', branch, '--title', title || 'Update Black Whale map data', '--body', body],
                { cwd: root },
              )
              await git(['checkout', 'main'])
              return send(res, 200, { prUrl: stdout.trim(), branch })
            } catch (err: any) {
              // Best-effort cleanup back to main.
              await git(['checkout', '--', '.']).catch(() => {})
              await git(['checkout', 'main']).catch(() => {})
              await git(['branch', '-D', branch]).catch(() => {})
              return send(res, 500, { error: err?.stderr || err?.message || String(err) })
            }
          }

          return send(res, 404, { error: 'Unknown endpoint' })
        } catch (err: any) {
          return send(res, 500, { error: err?.message || String(err) })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), editorApi()],
  server: {
    // The editor writes data + face images into /public; don't let Vite
    // full-reload the page (and drop in-progress edits) when it does.
    watch: { ignored: ['**/public/data/**', '**/public/faces/**'] },
  },
})
