import type { ReactNode } from "react"
import type { Color, PieceSymbol } from "chess.js"

const FILL = { w: "var(--color-piece-light)", b: "var(--color-piece-dark)" } as const
const STROKE = { w: "var(--color-piece-dark)", b: "var(--color-piece-light)" } as const

export function PieceSvg({
  color,
  type,
  className,
}: {
  color: Color
  type: PieceSymbol
  className?: string
}) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <g
        fill={FILL[color]}
        stroke={STROKE[color]}
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {SHAPES[type]}
      </g>
    </svg>
  )
}

function Foot() {
  return <path d="M18 64h44a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3z" />
}

const SHAPES: Record<PieceSymbol, ReactNode> = {
  p: (
    <>
      <circle cx="40" cy="20" r="10" />
      <path d="M29 32c1.5 7 .5 14-5 28h32c-5.5-14-6.5-21-5-28-4 3.5-8 4-11 2.2C36.8 36 33 35.5 29 32z" />
      <Foot />
    </>
  ),
  r: (
    <>
      <path d="M18 14h10v8H18zm17 0h10v8H35zm17 0h10v8H52zM16 20h48v7H16z" />
      <path d="M24 27h32l5 33H19z" />
      <Foot />
    </>
  ),
  n: (
    <>
      <path d="M22 66 18 50c4-2 6-8 4-14C18 28 20 16 32 12l-4-4 12 2c8 0 16 6 16 16 0 6-3 8-3 8l8 4c2 8-2 14-8 16l2 12H22z" />
      <Foot />
    </>
  ),
  b: (
    <>
      <path
        fillRule="evenodd"
        d="M40 8c2 6 4 8 4 12 8 6 14 16 12 32H24c-2-16 4-26 12-32 0-4 2-6 4-12zM37 28h6v12h-6z"
      />
      <Foot />
    </>
  ),
  q: (
    <>
      <circle cx="16" cy="22" r="5" />
      <circle cx="32" cy="14" r="5" />
      <circle cx="48" cy="14" r="5" />
      <circle cx="64" cy="22" r="5" />
      <path d="M18 26c6 8 10 12 12 26h20c2-14 6-18 12-26-6 6-12 5-22 5S24 32 18 26z" />
      <Foot />
    </>
  ),
  k: (
    <>
      <path d="M36 4h8v8h10v8H44v6h-8v-6H26v-8h10z" />
      <path d="M24 30h32l6 30H18z" />
      <Foot />
    </>
  ),
}
