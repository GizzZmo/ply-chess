import { Chess, type Color, type Square } from "chess.js"
import { create } from "zustand"
import { askEngine } from "./engine-client"
import { LEVELS, type LevelId } from "./levels"
import {
  hasMatingMaterial,
  outcome,
  repetitionCount,
  sideToMove,
  type GameResult,
} from "./rules"
import { playMoveSound } from "./sound"

export type Mode = "engine" | "pass" | "study"
export type Promo = "q" | "r" | "b" | "n"

export type HistNode = {
  fen: string
  san: string | null
  from?: string
  to?: string
  clocks: { w: number; b: number }
}

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

type Game = {
  nodes: HistNode[]
  index: number
  orientation: Color
  mode: Mode
  humanColor: Color
  level: LevelId
  minutes: number
  autoFlip: boolean
  mute: boolean
  selected: Square | null
  pending: { from: Square; to: Square } | null
  hint: { from: Square; to: Square } | null
  status: "playing" | "thinking" | "gameover"
  result: GameResult | null
  turnStartedAt: number | null
  confirmResign: boolean
  booted: boolean
  onSquare: (square: Square) => void
  promote: (piece: Promo) => void
  cancelPromotion: () => void
  undo: () => void
  jump: (index: number) => void
  flip: () => void
  startGame: () => void
  setMode: (mode: Mode) => void
  setHumanColor: (color: Color) => void
  setLevel: (level: LevelId) => void
  setMinutes: (minutes: number) => void
  setAutoFlip: (on: boolean) => void
  toggleMute: () => void
  resign: () => void
  armResign: () => void
  flag: (color: Color) => void
  hintMove: () => Promise<void>
  applyEngine: (from: string, to: string, promotion?: string) => void
  loadOpening: (moves: readonly string[]) => void
  hydrate: (data: unknown) => void
  boot: () => void
}

function isResult(value: unknown): value is GameResult {
  if (!value || typeof value !== "object") return false
  const result = value as GameResult
  return (
    typeof result.title === "string" &&
    typeof result.detail === "string" &&
    (result.winner === "w" || result.winner === "b" || result.winner === "draw")
  )
}

function freshNode(minutes: number): HistNode {
  const ms = minutes * 60_000
  return { fen: START, san: null, clocks: { w: ms, b: ms } }
}

function isPromo(value: string | undefined): value is Promo {
  return value === "q" || value === "r" || value === "b" || value === "n"
}

function userCanMove(state: Game, turn: Color) {
  if (state.status !== "playing" || state.pending) return false
  if (state.mode === "engine" && turn !== state.humanColor) return false
  return true
}

function applyMove(set: (partial: Partial<Game>) => void, get: () => Game, from: string, to: string, promotion?: string) {
  const state = get()
  const node = state.nodes[state.index]
  if (!node || state.status === "gameover") return
  const chess = new Chess(node.fen)
  const turn = chess.turn()
  const clocks = { ...node.clocks }
  if (state.minutes > 0 && state.mode !== "study" && state.turnStartedAt) {
    clocks[turn] = Math.max(0, clocks[turn] - (Date.now() - state.turnStartedAt))
  }
  let move
  try {
    move = isPromo(promotion) ? chess.move({ from, to, promotion }) : chess.move({ from, to })
  } catch {
    if (get().status === "thinking") set({ status: "playing" })
    return
  }
  const nodes = state.nodes.slice(0, state.index + 1)
  nodes.push({ fen: chess.fen(), san: move.san, from: move.from, to: move.to, clocks })
  const index = nodes.length - 1
  const result = outcome(chess, repetitionCount(nodes.map((entry) => entry.fen), index))
  set({
    nodes,
    index,
    orientation: state.mode === "pass" && state.autoFlip ? chess.turn() : state.orientation,
    selected: null,
    pending: null,
    hint: null,
    status: result ? "gameover" : "playing",
    result,
    confirmResign: false,
    turnStartedAt: result || state.minutes === 0 || state.mode === "study" ? null : Date.now(),
  })
  playMoveSound(move.san, Boolean(result))
}

function placeAt(state: Game, index: number): Partial<Game> {
  const node = state.nodes[index]
  if (!node) return {}
  const chess = new Chess(node.fen)
  const result = outcome(chess, repetitionCount(state.nodes.map((entry) => entry.fen), index))
  return {
    index,
    result,
    status: result ? "gameover" : "playing",
    selected: null,
    pending: null,
    hint: null,
    confirmResign: false,
    turnStartedAt: result || state.minutes === 0 || state.mode === "study" ? null : Date.now(),
    orientation: state.mode === "pass" && state.autoFlip ? chess.turn() : state.orientation,
  }
}

export const useGame = create<Game>((set, get) => ({
  nodes: [freshNode(10)],
  index: 0,
  orientation: "w",
  mode: "engine",
  humanColor: "w",
  level: "club",
  minutes: 10,
  autoFlip: true,
  mute: false,
  selected: null,
  pending: null,
  hint: null,
  status: "playing",
  result: null,
  turnStartedAt: null,
  confirmResign: false,
  booted: false,

  onSquare: (square) => {
    const state = get()
    const node = state.nodes[state.index]
    if (!node) return
    const chess = new Chess(node.fen)
    const turn = chess.turn()
    if (!userCanMove(state, turn)) return
    if (state.selected) {
      const moves = chess.moves({ square: state.selected, verbose: true }).filter((move) => move.to === square)
      if (moves.length > 0) {
        if (moves.some((move) => move.promotion)) {
          set({ pending: { from: state.selected, to: square }, confirmResign: false })
          return
        }
        applyMove(set, get, state.selected, square)
        return
      }
    }
    const piece = chess.get(square)
    if (piece && piece.color === turn) {
      set({ selected: square, pending: null, confirmResign: false })
      return
    }
    set({ selected: null, pending: null })
  },

  promote: (piece) => {
    const pending = get().pending
    if (!pending) return
    applyMove(set, get, pending.from, pending.to, piece)
  },

  cancelPromotion: () => set({ pending: null }),

  undo: () => {
    const state = get()
    if (state.index <= 0) return
    let target = state.index - 1
    if (state.mode === "engine") {
      while (target > 0 && sideToMove(state.nodes[target]?.fen ?? START) !== state.humanColor) {
        target -= 1
      }
    }
    set(placeAt(state, target))
  },

  jump: (index) => {
    const state = get()
    if (index < 0 || index >= state.nodes.length || index === state.index) return
    set(placeAt(state, index))
  },

  flip: () => set({ orientation: get().orientation === "w" ? "b" : "w" }),

  startGame: () => {
    const state = get()
    set({
      nodes: [freshNode(state.minutes)],
      index: 0,
      orientation: state.mode === "engine" ? state.humanColor : "w",
      selected: null,
      pending: null,
      hint: null,
      status: "playing",
      result: null,
      confirmResign: false,
      turnStartedAt: state.minutes > 0 && state.mode !== "study" ? Date.now() : null,
    })
  },

  setMode: (mode) => {
    if (get().mode === mode) return
    set({ mode })
    get().startGame()
  },

  setHumanColor: (color) => {
    set({ humanColor: color })
    if (get().mode === "engine") get().startGame()
  },

  setLevel: (level) => set({ level }),

  setMinutes: (minutes) => {
    if (get().minutes === minutes) return
    set({ minutes })
    get().startGame()
  },

  setAutoFlip: (on) => {
    const state = get()
    const turn = sideToMove(state.nodes[state.index]?.fen ?? START)
    set({
      autoFlip: on,
      orientation: on && state.mode === "pass" ? turn : state.orientation,
    })
  },

  toggleMute: () => set({ mute: !get().mute }),

  armResign: () => set({ confirmResign: !get().confirmResign }),

  resign: () => {
    const state = get()
    if (state.status === "gameover") return
    const turn = sideToMove(state.nodes[state.index]?.fen ?? START)
    const loser: Color = state.mode === "engine" ? state.humanColor : turn
    const winner: Color = loser === "w" ? "b" : "w"
    const name = winner === "w" ? "White" : "Black"
    set({
      status: "gameover",
      result: { winner, title: `${name} wins`, detail: "Resignation" },
      confirmResign: false,
      turnStartedAt: null,
      selected: null,
      pending: null,
      hint: null,
    })
  },

  flag: (color) => {
    const state = get()
    if (state.status === "gameover" || state.minutes === 0 || state.mode === "study") return
    const node = state.nodes[state.index]
    if (!node) return
    const chess = new Chess(node.fen)
    const winner: Color = color === "w" ? "b" : "w"
    if (!hasMatingMaterial(chess, winner)) {
      set({
        status: "gameover",
        result: { winner: "draw", title: "Draw", detail: "Time — not enough material" },
        turnStartedAt: null,
        selected: null,
        pending: null,
        hint: null,
        confirmResign: false,
      })
      return
    }
    const name = winner === "w" ? "White" : "Black"
    set({
      status: "gameover",
      result: { winner, title: `${name} wins`, detail: "Time" },
      turnStartedAt: null,
      selected: null,
      pending: null,
      hint: null,
      confirmResign: false,
    })
  },

  hintMove: async () => {
    const state = get()
    if (state.status !== "playing") return
    const fen = state.nodes[state.index]?.fen
    if (!fen) return
    if (state.mode === "engine" && sideToMove(fen) !== state.humanColor) return
    set({ status: "thinking", confirmResign: false, selected: null })
    const move = await askEngine(fen, { depth: 3, movetime: 700, noise: 0, book: false })
    const current = get()
    if (current.nodes[current.index]?.fen !== fen || current.status === "gameover") {
      if (get().status === "thinking") set({ status: "playing" })
      return
    }
    set({
      status: "playing",
      hint: move ? { from: move.from as Square, to: move.to as Square } : null,
    })
  },

  applyEngine: (from, to, promotion) => {
    const state = get()
    const fen = state.nodes[state.index]?.fen
    if (!fen || state.mode !== "engine") return
    const chess = new Chess(fen)
    if (chess.turn() === state.humanColor) return
    applyMove(set, get, from, to, promotion)
  },

  loadOpening: (moves) => {
    const minutes = get().minutes
    const ms = minutes * 60_000
    const chess = new Chess()
    const nodes: HistNode[] = [{ fen: chess.fen(), san: null, clocks: { w: ms, b: ms } }]
    for (const san of moves) {
      let move
      try {
        move = chess.move(san)
      } catch {
        move = null
      }
      if (!move) break
      nodes.push({ fen: chess.fen(), san: move.san, from: move.from, to: move.to, clocks: { w: ms, b: ms } })
    }
    set({
      mode: "study",
      nodes,
      index: nodes.length - 1,
      orientation: "w",
      selected: null,
      pending: null,
      hint: null,
      status: "playing",
      result: null,
      confirmResign: false,
      turnStartedAt: null,
      autoFlip: get().autoFlip,
    })
  },

  hydrate: (data) => {
    if (!data || typeof data !== "object") return
    const save = data as Partial<Game> & { v?: number; nodes?: HistNode[] }
    if (save.v !== 1 || !Array.isArray(save.nodes) || save.nodes.length === 0 || save.nodes.length > 500) return
    for (const node of save.nodes) {
      if (!node || typeof node.fen !== "string") return
      try {
        new Chess(node.fen)
      } catch {
        return
      }
    }
    const index = Math.min(Math.max(0, save.index ?? 0), save.nodes.length - 1)
    const mode: Mode = save.mode === "pass" || save.mode === "study" ? save.mode : "engine"
    const humanColor: Color = save.humanColor === "b" ? "b" : "w"
    const level: LevelId = save.level === "casual" || save.level === "sharp" ? save.level : "club"
    const minutes = save.minutes === 0 || save.minutes === 5 || save.minutes === 15 || save.minutes === 10 ? save.minutes : 10
    const orientation: Color = save.orientation === "b" ? "b" : "w"
    const status = save.status === "gameover" ? "gameover" : "playing"
    const result = status === "gameover" && isResult(save.result) ? save.result : null
    set({
      nodes: save.nodes,
      index,
      orientation,
      mode,
      humanColor,
      level,
      minutes,
      autoFlip: save.autoFlip !== false,
      mute: Boolean(save.mute),
      selected: null,
      pending: null,
      hint: null,
      status,
      result: status === "gameover" ? result : null,
      confirmResign: false,
      booted: true,
      turnStartedAt: status === "playing" && minutes > 0 && mode !== "study" ? Date.now() : null,
    })
  },

  boot: () => {
    if (get().booted) return
    const state = get()
    set({
      booted: true,
      turnStartedAt: state.minutes > 0 && state.mode !== "study" ? Date.now() : null,
    })
  },
}))

export { LEVELS }
