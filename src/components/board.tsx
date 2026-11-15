import { Chess, type Color, type PieceSymbol, type Square } from "chess.js"
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react"
import { PieceSvg } from "@/components/piece"
import { useGame } from "@/chess/store"
import { unlockAudio } from "@/chess/sound"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const
const PIECE_NAME: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
}

type Ghost = { x: number; y: number; size: number; type: PieceSymbol; color: Color; from: Square }

export function Board({ arrow }: { arrow?: { from: string; to: string } | null }) {
  const fen = useGame((s) => s.nodes[s.index]?.fen ?? "")
  const orientation = useGame((s) => s.orientation)
  const selected = useGame((s) => s.selected)
  const pending = useGame((s) => s.pending)
  const hint = useGame((s) => s.hint)
  const status = useGame((s) => s.status)
  const last = useGame((s) => s.nodes[s.index])
  const chess = useMemo(() => new Chess(fen), [fen])
  const boardRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ from: Square; id: number; x: number; y: number; moved: boolean } | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)

  const targets = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!selected || status !== "playing") return map
    for (const move of chess.moves({ square: selected, verbose: true })) {
      map.set(move.to, move.isCapture())
    }
    return map
  }, [chess, selected, status])

  const checkSquare = useMemo(() => {
    if (!chess.isCheck()) return null
    for (const row of chess.board()) {
      for (const piece of row) {
        if (piece && piece.type === "k" && piece.color === chess.turn()) return piece.square
      }
    }
    return null
  }, [chess])

  useEffect(() => {
    if (!pending) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") useGame.getState().cancelPromotion()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pending])

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, square: Square) {
    if (event.button !== 0) return
    event.preventDefault()
    unlockAudio()
    const piece = chess.get(square)
    const turn = chess.turn()
    useGame.getState().onSquare(square)
    if (status !== "playing" || pending) return
    if (!piece || piece.color !== turn) return
    if (useGame.getState().status !== "playing") return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { from: square, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || event.pointerId !== current.id) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.moved && dx * dx + dy * dy < 36) return
    current.moved = true
    const piece = chess.get(current.from)
    const rect = boardRef.current?.getBoundingClientRect()
    if (!piece || !rect) return
    setGhost({
      x: event.clientX,
      y: event.clientY,
      size: rect.width / 8,
      type: piece.type,
      color: piece.color,
      from: current.from,
    })
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    drag.current = null
    setGhost(null)
    if (!current || !current.moved || event.pointerId !== current.id) return
    const hit = document.elementFromPoint(event.clientX, event.clientY)
    const square = hit?.closest("[data-square]")?.getAttribute("data-square")
    if (square && square !== current.from) useGame.getState().onSquare(square as Square)
  }

  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  const files = orientation === "w" ? FILES : [...FILES].reverse()

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className="board-grid relative aspect-square w-full overflow-hidden rounded-md"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}` as Square
            const piece = chess.get(square)
            const light = (file.charCodeAt(0) - 97 + rank) % 2 === 0
            const capture = targets.get(square)
            const isTarget = targets.has(square)
            const showRank = orientation === "w" ? file === "a" : file === "h"
            const showFile = orientation === "w" ? rank === 1 : rank === 8
            const label = piece
              ? `${square} ${piece.color === "w" ? "white" : "black"} ${PIECE_NAME[piece.type]}`
              : `${square} empty`
            return (
              <button
                key={square}
                type="button"
                data-square={square}
                aria-label={label}
                aria-pressed={selected === square}
                className={`sq relative ${light ? "sq-light" : "sq-dark"} ${last?.from === square || last?.to === square ? "is-last" : ""} ${selected === square ? "is-selected" : ""} ${checkSquare === square ? "is-check" : ""}`}
                onPointerDown={(event) => onPointerDown(event, square)}
              >
                {showRank ? <span className="coord coord-rank">{rank}</span> : null}
                {showFile ? <span className="coord coord-file">{file}</span> : null}
                {isTarget && capture ? <span className="capture-ring" /> : null}
                {piece ? (
                  <PieceSvg
                    color={piece.color}
                    type={piece.type}
                    className={`piece ${ghost?.from === square ? "is-dragging" : ""}`}
                  />
                ) : null}
                {isTarget && !capture ? <span className="move-dot" /> : null}
              </button>
            )
          }),
        )}
        {hint ? (
          <HintArrow from={hint.from} to={hint.to} orientation={orientation} />
        ) : arrow ? (
          <HintArrow from={arrow.from} to={arrow.to} orientation={orientation} tone="soft" />
        ) : null}
      </div>
      {ghost ? (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: ghost.x,
            top: ghost.y,
            width: ghost.size,
            height: ghost.size,
            transform: "translate(-50%, -58%)",
          }}
        >
          <PieceSvg color={ghost.color} type={ghost.type} className="h-full w-full" />
        </div>
      ) : null}
      {pending ? (
        <div className="scrim absolute inset-0 z-20 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-title"
            className="w-full max-w-xs rounded-xl bg-elevated p-4 shadow-none"
          >
            <h2 id="promo-title" className="font-display text-xl leading-tight">
              Promote pawn
            </h2>
            <p className="mt-1 text-sm text-muted">Choose a piece. Esc cancels.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {(["q", "r", "b", "n"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className="flex h-14 items-center justify-center rounded-md bg-subtle"
                  aria-label={`Promote to ${PIECE_NAME[type]}`}
                  onClick={() => useGame.getState().promote(type)}
                >
                  <PieceSvg color={chess.turn()} type={type} className="h-10 w-10" />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 h-11 w-full rounded-md text-sm text-muted"
              onClick={() => useGame.getState().cancelPromotion()}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HintArrow({
  from,
  to,
  orientation,
  tone = "hint",
}: {
  from: string
  to: string
  orientation: Color
  tone?: "hint" | "soft"
}) {
  const a = center(from, orientation)
  const b = center(to, orientation)
  const stroke = tone === "soft" ? "var(--color-accent)" : "var(--color-fg)"
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeWidth={tone === "soft" ? "1.25" : "1.5"}
        strokeLinecap="round"
        opacity={tone === "soft" ? 0.85 : 1}
      />
      <circle cx={b.x} cy={b.y} r="2.1" fill="none" stroke={stroke} strokeWidth="1.2" opacity={tone === "soft" ? 0.85 : 1} />
    </svg>
  )
}

function center(square: string, orientation: Color) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const x = orientation === "w" ? file : 7 - file
  const y = orientation === "w" ? 7 - rank : rank
  return { x: ((x + 0.5) / 8) * 100, y: ((y + 0.5) / 8) * 100 }
}
