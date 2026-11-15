import { Chess, type Move, type PieceSymbol } from "chess.js"
import { bookMove } from "./openings"
import type { EngineMove, SearchOpts } from "./types"

const VAL: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
}

const MATE = 100_000
const INF = 1_000_000

const PST: Record<PieceSymbol, number[]> = {
  p: flat([
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]),
  n: flat([
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ]),
  b: flat([
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ]),
  r: flat([
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ]),
  q: flat([
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ]),
  k: flat([
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ]),
}

const KING_EG = flat([
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
])

class TimeUp extends Error {
  constructor() {
    super("time")
    this.name = "TimeUp"
  }
}

function flat(rows: number[][]): number[] {
  return rows.flat()
}

function play(chess: Chess, move: Move) {
  if (move.promotion && move.promotion !== "k" && move.promotion !== "p") {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion })
  } else {
    chess.move({ from: move.from, to: move.to })
  }
}

function moveRank(move: Move): number {
  let score = 0
  if (move.captured) score += 10 * VAL[move.captured] - VAL[move.piece]
  if (move.promotion) score += 800
  if (move.san.includes("+") || move.san.includes("#")) score += 50
  if (move.isKingsideCastle() || move.isQueensideCastle()) score += 30
  return score
}

function ordered(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true })
  moves.sort((a, b) => moveRank(b) - moveRank(a))
  return moves
}

function evaluateWhite(chess: Chess): number {
  const board = chess.board()
  let queens = 0
  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === "q") queens++
    }
  }
  const endgame = queens === 0
  let score = 0
  let whiteBishops = 0
  let blackBishops = 0
  for (let rank = 0; rank < 8; rank++) {
    const row = board[rank]
    if (!row) continue
    for (let file = 0; file < 8; file++) {
      const piece = row[file]
      if (!piece) continue
      if (piece.type === "b") {
        if (piece.color === "w") whiteBishops++
        else blackBishops++
      }
      const index = rank * 8 + file
      const tableIndex = piece.color === "w" ? index : index ^ 56
      const table = piece.type === "k" && endgame ? KING_EG : PST[piece.type]
      const value = VAL[piece.type] + (table[tableIndex] ?? 0)
      score += piece.color === "w" ? value : -value
    }
  }
  if (whiteBishops >= 2) score += 30
  if (blackBishops >= 2) score -= 30
  return score
}

function evalSTM(chess: Chess): number {
  const white = evaluateWhite(chess)
  return chess.turn() === "w" ? white : -white
}

function quiesce(chess: Chess, alpha: number, beta: number, deadline: number, qdepth: number): number {
  if (performance.now() > deadline) throw new TimeUp()
  const all = chess.moves({ verbose: true })
  if (all.length === 0) return chess.isCheck() ? -MATE - qdepth : 0
  if (qdepth >= 4) return evalSTM(chess)

  const inCheck = chess.isCheck()
  let best = -INF
  if (!inCheck) {
    const stand = evalSTM(chess)
    if (stand >= beta) return stand
    if (stand > alpha) alpha = stand
    best = stand
  }

  let moves = inCheck ? all : all.filter((move) => move.isCapture() || move.promotion)
  if (moves.length === 0) return best
  moves.sort((a, b) => moveRank(b) - moveRank(a))

  for (const move of moves) {
    if (performance.now() > deadline) throw new TimeUp()
    play(chess, move)
    let score = 0
    try {
      score = -quiesce(chess, -beta, -alpha, deadline, qdepth + 1)
    } finally {
      chess.undo()
    }
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  return best
}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, deadline: number): number {
  if (performance.now() > deadline) throw new TimeUp()
  if (depth === 0) return quiesce(chess, alpha, beta, deadline, 0)
  if (chess.isDrawByFiftyMoves() || chess.isInsufficientMaterial()) return 0

  const moves = ordered(chess)
  if (moves.length === 0) return chess.isCheck() ? -MATE - depth : 0

  let best = -INF
  for (const move of moves) {
    if (performance.now() > deadline) throw new TimeUp()
    play(chess, move)
    let score = 0
    try {
      score = -negamax(chess, depth - 1, -beta, -alpha, deadline)
    } finally {
      chess.undo()
    }
    if (score > best) best = score
    if (score > alpha) alpha = score
    if (alpha >= beta) break
  }
  return best
}

function toEngine(move: Move): EngineMove {
  const promotion =
    move.promotion && move.promotion !== "k" && move.promotion !== "p" ? move.promotion : undefined
  return { from: move.from, to: move.to, promotion }
}

export function findBestMove(fen: string, opts: SearchOpts): EngineMove | null {
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch {
    return null
  }

  if (opts.book) {
    const leaveBook = opts.noise > 0 && Math.random() < 0.35
    if (!leaveBook) {
      const booked = bookMove(fen)
      if (booked) return booked
    }
  }

  let moves = ordered(chess)
  if (moves.length === 0) return null
  if (moves.length === 1) return toEngine(moves[0]!)

  const deadline = performance.now() + Math.max(40, opts.movetime)
  let best = moves[0]!
  let bestList: { move: Move; score: number }[] = []

  const maxDepth = Math.max(1, opts.depth)
  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -INF
    const scored: { move: Move; score: number }[] = []
    let timedOut = false
    for (const move of moves) {
      if (performance.now() > deadline) {
        timedOut = true
        break
      }
      play(chess, move)
      let score = 0
      let expired = false
      try {
        score = -negamax(chess, depth - 1, -INF, -alpha, deadline)
      } catch (error) {
        if (error instanceof TimeUp) expired = true
        else throw error
      } finally {
        chess.undo()
      }
      if (expired) {
        timedOut = true
        break
      }
      scored.push({ move, score })
      if (score > alpha) alpha = score
    }

    if (scored.length === 0) break
    scored.sort((a, b) => b.score - a.score)
    const completed = !timedOut && scored.length === moves.length
    if (completed || depth === 1) {
      bestList = scored
      moves = scored.map((entry) => entry.move)
      best = scored[0]!.move
    }
    if (!completed) break
  }

  if (opts.noise > 0 && bestList.length > 1) {
    const top = bestList[0]!.score
    const pool = bestList.filter((entry) => top - entry.score <= opts.noise)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) best = pick.move
  }

  return toEngine(best)
}
