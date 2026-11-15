import { Chess } from "chess.js"
import type { EngineMove } from "./types"

export type Opening = {
  eco: string
  name: string
  moves: readonly string[]
}

export const OPENINGS: readonly Opening[] = [
  { eco: "C20", name: "King's Pawn Game", moves: ["e4"] },
  { eco: "C20", name: "Open Game", moves: ["e4", "e5"] },
  { eco: "C40", name: "King's Knight Opening", moves: ["e4", "e5", "Nf3"] },
  { eco: "C44", name: "King's Knight, 2...Nc6", moves: ["e4", "e5", "Nf3", "Nc6"] },
  { eco: "C60", name: "Ruy Lopez", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { eco: "C70", name: "Ruy Lopez, Morphy Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"] },
  { eco: "C69", name: "Ruy Lopez, Exchange", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6"] },
  { eco: "C78", name: "Ruy Lopez, 5.Ba4", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"] },
  { eco: "C65", name: "Ruy Lopez, Berlin Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"] },
  { eco: "C84", name: "Ruy Lopez, Closed", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"] },
  {
    eco: "C92",
    name: "Ruy Lopez, Chigorin",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"],
  },
  {
    eco: "C89",
    name: "Ruy Lopez, Marshall Attack",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"],
  },
  { eco: "C50", name: "Italian Game", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { eco: "C50", name: "Giuoco Piano", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"] },
  { eco: "C55", name: "Two Knights Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"] },
  { eco: "C57", name: "Fried Liver Attack", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5"] },
  { eco: "C51", name: "Evans Gambit", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"] },
  { eco: "C45", name: "Scotch Game", moves: ["e4", "e5", "Nf3", "Nc6", "d4"] },
  { eco: "C45", name: "Scotch, 4...exd4", moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4"] },
  { eco: "C47", name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"] },
  { eco: "C30", name: "King's Gambit", moves: ["e4", "e5", "f4"] },
  { eco: "C33", name: "King's Gambit Accepted", moves: ["e4", "e5", "f4", "exf4"] },
  { eco: "C25", name: "Vienna Game", moves: ["e4", "e5", "Nc3"] },
  { eco: "C41", name: "Philidor Defense", moves: ["e4", "e5", "Nf3", "d6"] },
  { eco: "C42", name: "Petrov Defense", moves: ["e4", "e5", "Nf3", "Nf6"] },
  { eco: "C42", name: "Petrov, 3.Nxe5", moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5"] },
  { eco: "B20", name: "Sicilian Defense", moves: ["e4", "c5"] },
  { eco: "B90", name: "Sicilian Najdorf", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
  { eco: "B70", name: "Sicilian Dragon", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"] },
  { eco: "B80", name: "Sicilian Scheveningen", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"] },
  { eco: "B56", name: "Sicilian Classical", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6"] },
  { eco: "B33", name: "Sicilian Sveshnikov", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"] },
  { eco: "B34", name: "Sicilian Accelerated Dragon", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6"] },
  { eco: "B41", name: "Sicilian Kan", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"] },
  { eco: "B48", name: "Sicilian Taimanov", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6"] },
  { eco: "B22", name: "Sicilian Alapin", moves: ["e4", "c5", "c3"] },
  { eco: "B21", name: "Sicilian Smith-Morra Gambit", moves: ["e4", "c5", "d4"] },
  { eco: "B23", name: "Sicilian Closed", moves: ["e4", "c5", "Nc3"] },
  { eco: "C00", name: "French Defense", moves: ["e4", "e6"] },
  { eco: "C02", name: "French Advance", moves: ["e4", "e6", "d4", "d5", "e5"] },
  { eco: "C02", name: "French Advance, 3...c5", moves: ["e4", "e6", "d4", "d5", "e5", "c5"] },
  { eco: "C03", name: "French Tarrasch", moves: ["e4", "e6", "d4", "d5", "Nd2"] },
  { eco: "C15", name: "French Winawer", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"] },
  { eco: "C11", name: "French Classical", moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"] },
  { eco: "C01", name: "French Exchange", moves: ["e4", "e6", "d4", "d5", "exd5"] },
  { eco: "B10", name: "Caro-Kann Defense", moves: ["e4", "c6"] },
  { eco: "B12", name: "Caro-Kann Advance", moves: ["e4", "c6", "d4", "d5", "e5"] },
  { eco: "B18", name: "Caro-Kann Classical", moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"] },
  { eco: "B13", name: "Caro-Kann Exchange", moves: ["e4", "c6", "d4", "d5", "exd5"] },
  { eco: "B14", name: "Caro-Kann Panov", moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "c4"] },
  { eco: "B07", name: "Pirc Defense", moves: ["e4", "d6"] },
  { eco: "B08", name: "Pirc, Classical", moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"] },
  { eco: "B06", name: "Modern Defense", moves: ["e4", "g6"] },
  { eco: "B02", name: "Alekhine Defense", moves: ["e4", "Nf6"] },
  { eco: "B03", name: "Alekhine, Modern", moves: ["e4", "Nf6", "e5", "Nd5", "d4"] },
  { eco: "B01", name: "Scandinavian Defense", moves: ["e4", "d5"] },
  { eco: "B01", name: "Scandinavian, 2...Qxd5", moves: ["e4", "d5", "exd5", "Qxd5"] },
  { eco: "D00", name: "Queen's Pawn Game", moves: ["d4"] },
  { eco: "D06", name: "Queen's Gambit", moves: ["d4", "d5", "c4"] },
  { eco: "D30", name: "Queen's Gambit Declined", moves: ["d4", "d5", "c4", "e6"] },
  { eco: "D37", name: "QGD, Orthodox", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7"] },
  { eco: "D35", name: "QGD Exchange", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5"] },
  { eco: "D20", name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4"] },
  { eco: "D10", name: "Slav Defense", moves: ["d4", "d5", "c4", "c6"] },
  { eco: "D43", name: "Semi-Slav Defense", moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"] },
  { eco: "E20", name: "Nimzo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"] },
  { eco: "E32", name: "Nimzo-Indian, Classical", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2"] },
  { eco: "E12", name: "Queen's Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"] },
  { eco: "E00", name: "Catalan Opening", moves: ["d4", "Nf6", "c4", "e6", "g3"] },
  { eco: "E60", name: "King's Indian Defense", moves: ["d4", "Nf6", "c4", "g6"] },
  { eco: "E90", name: "King's Indian, Classical", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3"] },
  { eco: "D80", name: "Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] },
  { eco: "D85", name: "Grünfeld Exchange", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5"] },
  { eco: "A70", name: "Modern Benoni", moves: ["d4", "Nf6", "c4", "c5", "d5", "e6"] },
  { eco: "A57", name: "Benko Gambit", moves: ["d4", "Nf6", "c4", "c5", "d5", "b5"] },
  { eco: "A80", name: "Dutch Defense", moves: ["d4", "f5"] },
  { eco: "A96", name: "Dutch Leningrad", moves: ["d4", "f5", "c4", "Nf6", "g3", "g6"] },
  { eco: "D02", name: "London System", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"] },
  { eco: "A45", name: "Trompowsky Attack", moves: ["d4", "Nf6", "Bg5"] },
  { eco: "A10", name: "English Opening", moves: ["c4"] },
  { eco: "A30", name: "English Symmetrical", moves: ["c4", "c5"] },
  { eco: "A20", name: "English, 1...e5", moves: ["c4", "e5"] },
  { eco: "A04", name: "Réti Opening", moves: ["Nf3"] },
  { eco: "A09", name: "Réti, 1...d5", moves: ["Nf3", "d5"] },
  { eco: "A07", name: "King's Indian Attack", moves: ["Nf3", "d5", "g3"] },
  { eco: "A02", name: "Bird Opening", moves: ["f4"] },
  { eco: "A01", name: "Nimzo-Larsen Attack", moves: ["b3"] },
]

type BookEdge = EngineMove & { san: string }

const book = new Map<string, BookEdge[]>()

export function positionKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ")
}

function remember(key: string, edge: BookEdge) {
  const list = book.get(key)
  if (!list) {
    book.set(key, [edge])
    return
  }
  if (list.some((item) => item.san === edge.san)) return
  list.push(edge)
}

for (const line of OPENINGS) {
  const chess = new Chess()
  for (const san of line.moves) {
    const key = positionKey(chess.fen())
    let move
    try {
      move = chess.move(san)
    } catch {
      move = null
    }
    if (!move) throw new Error(`Illegal opening move ${san} in ${line.name}`)
    remember(key, { san: move.san, from: move.from, to: move.to })
  }
}

export function matchOpening(sans: readonly string[]): Opening | null {
  let best: Opening | null = null
  for (const line of OPENINGS) {
    if (line.moves.length === 0 || line.moves.length > sans.length) continue
    let same = true
    for (let i = 0; i < line.moves.length; i++) {
      if (line.moves[i] !== sans[i]) {
        same = false
        break
      }
    }
    if (same && (!best || line.moves.length > best.moves.length)) best = line
  }
  return best
}

export function bookMoves(fen: string): string[] {
  return (book.get(positionKey(fen)) ?? []).map((edge) => edge.san)
}

export function bookMove(fen: string): EngineMove | null {
  const edges = book.get(positionKey(fen))
  if (!edges || edges.length === 0) return null
  const pick = edges[Math.floor(Math.random() * edges.length)]
  if (!pick) return null
  return { from: pick.from, to: pick.to }
}
