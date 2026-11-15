import type { Color, Square } from "chess.js"
import { useEffect, useState } from "react"
import { formatScore, stockfishAsset, whiteShare, type SfAnalysis, type SfLine } from "@/chess/stockfish"
import { useGame, type Promo } from "@/chess/store"

const PREF_KEY = "ply-stockfish-v1"
const DEPTHS = [10, 14, 18] as const

export function useStockfishPreference() {
  const [enabled, setEnabled] = useState(true)
  const [depth, setDepth] = useState<(typeof DEPTHS)[number]>(14)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { enabled?: boolean; depth?: number }
      if (typeof saved.enabled === "boolean") setEnabled(saved.enabled)
      if (saved.depth === 10 || saved.depth === 14 || saved.depth === 18) setDepth(saved.depth)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ enabled, depth }))
    } catch {
      /* ignore */
    }
  }, [enabled, depth])

  return { enabled, setEnabled, depth, setDepth }
}

export function StockfishBar({
  enabled,
  line,
  orientation,
}: {
  enabled: boolean
  line: SfLine | null
  orientation: Color
}) {
  if (!enabled) return null
  const share = whiteShare(line)
  const whiteBottom = orientation === "w"
  const bottom = whiteBottom ? share : 1 - share
  return (
    <div
      className={`relative w-3 shrink-0 self-stretch overflow-hidden rounded-sm ${whiteBottom ? "bg-board-dark" : "bg-board-light"}`}
      role="img"
      aria-label={line ? `Evaluation ${formatScore(line)} for White` : "Stockfish evaluation"}
    >
      <div
        className={`absolute inset-x-0 bottom-0 ${whiteBottom ? "bg-board-light" : "bg-board-dark"}`}
        style={{ height: `${bottom * 100}%` }}
      />
    </div>
  )
}

export function StockfishPanel({
  enabled,
  depth,
  onEnabled,
  onDepth,
  analysis,
}: {
  enabled: boolean
  depth: number
  onEnabled: (on: boolean) => void
  onDepth: (depth: (typeof DEPTHS)[number]) => void
  analysis: SfAnalysis
}) {
  const nodes = useGame((s) => s.nodes)
  const index = useGame((s) => s.index)
  const best = analysis.lines.find((line) => line.multipv === 1) ?? analysis.lines[0] ?? null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Stockfish</h2>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabled(!enabled)}
          className="flex h-8 items-center gap-2 rounded-md bg-subtle px-2 text-xs"
        >
          <span className="text-muted">{enabled ? "On" : "Off"}</span>
          <span className={`h-4 w-7 rounded-full p-0.5 ${enabled ? "bg-accent" : "bg-border"}`}>
            <span className={`block h-3 w-3 rounded-full bg-bg ${enabled ? "translate-x-3" : ""}`} />
          </span>
        </button>
      </div>
      {enabled ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-3xl leading-none tabular-nums">{best ? formatScore(best) : "…"}</p>
            <p className="pb-1 text-xs text-faint">
              {analysis.failed
                ? "Unavailable"
                : best
                  ? `depth ${best.depth} · ${compact(best.nodes)} nodes`
                  : analysis.ready
                    ? "Thinking"
                    : "Loading"}
            </p>
          </div>
          <EvalGraph nodes={nodes.map((node) => node.fen)} index={index} history={analysis.history} />
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1">
            {DEPTHS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === depth}
                onClick={() => onDepth(value)}
                className={`h-9 rounded-md text-xs font-medium ${value === depth ? "bg-accent text-accent-fg" : "text-muted"}`}
              >
                d{value}
              </button>
            ))}
          </div>
          <ol className="flex flex-col">
            {analysis.lines.map((line) => (
              <li key={line.multipv}>
                <button
                  type="button"
                  onClick={() => playUci(line.pvUci[0])}
                  className="grid w-full grid-cols-[1.5rem_3.2rem_1fr] items-baseline gap-1 rounded-md px-1 py-1.5 text-left"
                >
                  <span className="text-xs tabular-nums text-faint">{line.multipv}</span>
                  <span className="text-sm tabular-nums">{formatScore(line)}</span>
                  <span className="truncate text-xs text-muted">{line.pvSan || "—"}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="text-xs text-faint">
            Stockfish 19 lite, in this browser.{" "}
            <a className="underline" href={stockfishAsset("COPYING.txt")}>
              GPL-3.0
            </a>
            . Tap a line to try its first move.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">The evaluation bar and lines stay hidden until you turn it on.</p>
      )}
    </div>
  )
}

function EvalGraph({
  nodes,
  index,
  history,
}: {
  nodes: string[]
  index: number
  history: Record<string, number>
}) {
  const points = nodes.map((fen) => history[fen])
  const known = points.filter((value): value is number => value != null)
  if (known.length < 2) return null
  const coords = points.map((value, i) => {
    if (value == null) return null
    const x = nodes.length === 1 ? 50 : (i / (nodes.length - 1)) * 100
    const pawns = Math.max(-5, Math.min(5, value / 100))
    const y = 28 - (pawns / 5) * 22
    return { x, y }
  })
  const drawn = coords.filter((point): point is { x: number; y: number } => point != null)
  const d = drawn.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")
  const cursor = nodes.length === 1 ? 50 : (index / (nodes.length - 1)) * 100
  return (
    <svg viewBox="0 0 100 56" className="h-14 w-full" role="img" aria-label="Evaluation over the game">
      <line x1="0" y1="28" x2="100" y2="28" stroke="var(--color-border)" strokeWidth="1" />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={cursor} y1="4" x2={cursor} y2="52" stroke="var(--color-faint)" strokeWidth="0.6" />
    </svg>
  )
}

function compact(nodes: number): string {
  if (nodes >= 1_000_000) return `${(nodes / 1_000_000).toFixed(1)}M`
  if (nodes >= 1_000) return `${Math.round(nodes / 1_000)}k`
  return String(nodes)
}

function playUci(uci: string | undefined) {
  if (!uci || uci.length < 4) return
  const from = uci.slice(0, 2) as Square
  const to = uci.slice(2, 4) as Square
  const promotion = uci[4] as Promo | undefined
  const game = useGame.getState()
  game.onSquare(from)
  game.onSquare(to)
  if (promotion && useGame.getState().pending) useGame.getState().promote(promotion)
}
