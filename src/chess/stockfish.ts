import { Chess, type Square } from "chess.js"
import { useEffect, useRef, useState } from "react"
import { previewPathPrefix } from "@/lib/preview-path-prefix"

export type SfLine = {
  multipv: number
  depth: number
  cp: number | null
  mate: number | null
  pvSan: string
  pvUci: string[]
  nodes: number
  nps: number
}

export type SfAnalysis = {
  ready: boolean
  failed: string | null
  lines: SfLine[]
  history: Record<string, number>
}

const EMPTY: SfAnalysis = { ready: false, failed: null, lines: [], history: {} }
const MATE_CP = 2000

export function stockfishAsset(file: string): string {
  const prefix =
    typeof window === "undefined"
      ? ""
      : (previewPathPrefix(window.location.hostname, window.location.pathname) ?? "")
  return `${prefix}/stockfish/${file}`
}

export function stockfishWorkerUrl(): string {
  return stockfishAsset("stockfish-19-lite-single.js")
}

export function formatScore(line: Pick<SfLine, "cp" | "mate">): string {
  if (line.mate != null) {
    if (line.mate > 0) return `+M${line.mate}`
    if (line.mate < 0) return `-M${-line.mate}`
    return "M0"
  }
  if (line.cp == null) return "0.00"
  const pawns = line.cp / 100
  const text = Math.abs(pawns).toFixed(2)
  return pawns > 0 ? `+${text}` : pawns < 0 ? `-${text}` : "0.00"
}

export function whiteShare(line: Pick<SfLine, "cp" | "mate"> | null): number {
  if (!line) return 0.5
  if (line.mate != null) return line.mate > 0 ? 1 : line.mate < 0 ? 0 : 0.5
  const cp = Math.max(-1000, Math.min(1000, line.cp ?? 0))
  return (cp + 1000) / 2000
}

function whiteScore(fen: string, kind: "cp" | "mate", value: number): { cp: number | null; mate: number | null } {
  const black = fen.split(" ")[1] === "b"
  const signed = black ? -value : value
  if (kind === "mate") return { cp: null, mate: signed }
  return { cp: signed, mate: null }
}

function pvToSan(fen: string, uciMoves: string[]): string {
  const chess = new Chess(fen)
  const sans: string[] = []
  for (const uci of uciMoves) {
    if (uci.length < 4) break
    const from = uci.slice(0, 2) as Square
    const to = uci.slice(2, 4) as Square
    const promotion = uci[4]
    let move
    try {
      move = promotion ? chess.move({ from, to, promotion }) : chess.move({ from, to })
    } catch {
      move = null
    }
    if (!move) break
    sans.push(move.san)
  }
  return sans.join(" ")
}

function parseInfo(fen: string, line: string): SfLine | null {
  if (!line.startsWith("info ") || !line.includes(" pv ") || !line.includes(" score ")) return null
  const depth = Number(line.match(/\bdepth (\d+)/)?.[1] ?? 0)
  const multipv = Number(line.match(/\bmultipv (\d+)/)?.[1] ?? 1)
  const score = line.match(/\bscore (cp|mate) (-?\d+)/)
  if (!score || !depth) return null
  const nodes = Number(line.match(/\bnodes (\d+)/)?.[1] ?? 0)
  const nps = Number(line.match(/\bnps (\d+)/)?.[1] ?? 0)
  const pvUci = (line.split(" pv ")[1] ?? "").trim().split(/\s+/).filter(Boolean)
  const white = whiteScore(fen, score[1] === "mate" ? "mate" : "cp", Number(score[2]))
  return {
    multipv,
    depth,
    cp: white.cp,
    mate: white.mate,
    pvSan: pvToSan(fen, pvUci),
    pvUci,
    nodes,
    nps,
  }
}

class Session {
  private worker: Worker | null = null
  private ready = false
  private searching = false
  private fen = ""
  private depth = 12
  private pending: string | null = null
  private lines: SfLine[] = []
  private history: Record<string, number> = {}
  private dead = false

  constructor(private readonly emit: (state: SfAnalysis) => void) {}

  start() {
    try {
      this.worker = new Worker(stockfishWorkerUrl())
    } catch (error) {
      this.fail(error instanceof Error ? error.message : "Stockfish did not start")
      return
    }
    this.worker.onerror = () => this.fail("Stockfish failed to load")
    this.worker.onmessage = (event: MessageEvent<unknown>) => {
      const text = typeof event.data === "string" ? event.data : ""
      if (!text || this.dead) return
      this.onLine(text)
    }
    this.worker.postMessage("uci")
  }

  analyze(fen: string, depth: number) {
    const depthChanged = depth !== this.depth
    this.depth = depth
    if (!fen) return
    if (fen === this.fen && this.searching && !depthChanged) return
    this.pending = fen
    if (!this.ready) return
    if (this.searching) {
      this.worker?.postMessage("stop")
      return
    }
    this.go(fen)
  }

  stop() {
    this.dead = true
    try {
      this.worker?.postMessage("quit")
    } catch {
      /* already gone */
    }
    this.worker?.terminate()
    this.worker = null
  }

  private fail(message: string) {
    if (this.dead) return
    this.emit({ ready: false, failed: message, lines: [], history: this.history })
  }

  private publish() {
    if (this.dead) return
    this.emit({ ready: this.ready, failed: null, lines: this.lines, history: { ...this.history } })
  }

  private go(fen: string) {
    this.fen = fen
    this.pending = null
    this.searching = true
    this.lines = []
    this.publish()
    this.worker?.postMessage(`position fen ${fen}`)
    this.worker?.postMessage(`go depth ${this.depth}`)
  }

  private onLine(line: string) {
    if (line === "uciok") {
      this.worker?.postMessage("setoption name MultiPV value 3")
      this.worker?.postMessage("isready")
      return
    }
    if (line === "readyok") {
      this.ready = true
      this.publish()
      if (this.pending) this.go(this.pending)
      return
    }
    if (line.startsWith("bestmove")) {
      this.searching = false
      if (this.pending) this.go(this.pending)
      return
    }
    const info = parseInfo(this.fen, line)
    if (!info) return
    const next = this.lines.filter((item) => item.multipv !== info.multipv)
    next.push(info)
    next.sort((a, b) => a.multipv - b.multipv)
    this.lines = next
    if (info.multipv === 1 && info.depth >= 8) {
      this.history[this.fen] = info.mate != null ? Math.sign(info.mate) * MATE_CP : (info.cp ?? 0)
    }
    this.publish()
  }
}

export function useStockfish(fen: string, enabled: boolean, depth: number): SfAnalysis {
  const [state, setState] = useState<SfAnalysis>(EMPTY)
  const sessionRef = useRef<Session | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      sessionRef.current?.stop()
      sessionRef.current = null
      return
    }
    const session = new Session(setState)
    sessionRef.current = session
    session.start()
    return () => {
      session.stop()
      if (sessionRef.current === session) sessionRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    sessionRef.current?.analyze(fen, depth)
  }, [enabled, fen, depth])

  if (!enabled) return EMPTY
  return state
}
