// Minimal, consistent 24x24 stroke icons. Inherit `currentColor`.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (props: P) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const Play = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>
)
export const Pause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>
)
export const Prev = (p: P) => (
  <svg {...base(p)}><path d="M18 6v12M8 12l8-6v12z" /></svg>
)
export const Next = (p: P) => (
  <svg {...base(p)}><path d="M6 6v12M16 12L8 6v12z" /></svg>
)
export const Close = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const Search = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
)
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Pin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
)
export const Trash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
)
export const Upload = (p: P) => (
  <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
)
export const External = (p: P) => (
  <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>
)
export const Pencil = (p: P) => (
  <svg {...base(p)}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" /></svg>
)
export const Whale = (p: P) => (
  <svg {...base(p)} strokeWidth={1.6}><path d="M3 12c3.5 0 4-4 9-4s6 3 9 3c0 3-3 6-8 6-4 0-7-1.5-8-3-1 .5-2 .5-3 0z" /><circle cx="9" cy="11" r=".6" fill="currentColor" /></svg>
)
