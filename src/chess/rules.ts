import { Chess, type Color, type PieceSymbol } from "chess.js"

export type GameResult = {
  title: string
  detail: string
  winner: Color | "draw"
}

const WORTH: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const START_COUNT: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
const CAPTURE_ORDER: PieceSymbol[] = ["q", "r", "b", "n", "p"]

export function sideToMove(fen: string): Color {
  return fen.split(" ")[1] === "b" ? "b" : "w"
}

export function positionKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ")
}

export function repetitionCount(fens: string[], index: number): number {
  const key = positionKey(fens[index] ?? "")
  let count = 0
  for (let i = 0; i <= index; i++) {
    if (positionKey(fens[i] ?? "") === key) count++
  }
  return count
}

export function outcome(chess: Chess, reps: number): GameResult | null {
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === "w" ? "b" : "w"
    return {
      winner,
      title: winner === "w" ? "White wins" : "Black wins",
      detail: "Checkmate",
    }
  }
  if (chess.isStalemate()) return { winner: "draw", title: "Draw", detail: "Stalemate" }
  if (reps >= 3) return { winner: "draw", title: "Draw", detail: "Threefold repetition" }
  if (chess.isDrawByFiftyMoves()) return { winner: "draw", title: "Draw", detail: "Fifty-move rule" }
  if (chess.isInsufficientMaterial()) {
    return { winner: "draw", title: "Draw", detail: "Insufficient material" }
  }
  return null
}

/** Can this side force mate? Used when the other side flags. */
export function hasMatingMaterial(chess: Chess, color: Color): boolean {
  let queens = 0
  let rooks = 0
  let bishops = 0
  let knights = 0
  let pawns = 0
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece || piece.color !== color) continue
      if (piece.type === "q") queens++
      else if (piece.type === "r") rooks++
      else if (piece.type === "b") bishops++
      else if (piece.type === "n") knights++
      else if (piece.type === "p") pawns++
    }
  }
  if (queens || rooks || pawns) return true
  if (bishops >= 2) return true
  if (bishops >= 1 && knights >= 1) return true
  return false
}

export function capturedBy(chess: Chess, by: Color): PieceSymbol[] {
  const opponent: Color = by === "w" ? "b" : "w"
  const have: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  for (const row of chess.board()) {
    for (const piece of row) {
      if (piece && piece.color === opponent) have[piece.type]++
    }
  }
  const out: PieceSymbol[] = []
  for (const type of CAPTURE_ORDER) {
    const missing = START_COUNT[type] - have[type]
    for (let i = 0; i < missing; i++) out.push(type)
  }
  return out
}

/** Positive when white is ahead, in pawn units. */
export function materialForWhite(chess: Chess): number {
  let score = 0
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue
      score += piece.color === "w" ? WORTH[piece.type] : -WORTH[piece.type]
    }
  }
  return score
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
