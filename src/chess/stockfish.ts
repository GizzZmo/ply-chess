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

export type StockfishMove = { from: string; to: string; promotion?: string }

class Player {
  private worker: Worker | null = null
  private booted = false
  private busy = false
  private elo: number | null | undefined = undefined
  private afterReady: (() => void) | null = null
  private job: { fen: string; movetime: number; resolve: (move: StockfishMove | null) => void } | null = null
  private queued: {
    fen: string
    elo: number | null
    movetime: number
    resolve: (move: StockfishMove | null) => void
  } | null = null

  constructor() {
    this.worker = new Worker(stockfishWorkerUrl())
    this.worker.onerror = () => this.fail()
    this.worker.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data === "string") this.onLine(event.data)
    }
    this.worker.postMessage("uci")
  }

  ask(fen: string, elo: number | null, movetime: number): Promise<StockfishMove | null> {
    return new Promise((resolve) => {
      if (this.queued) this.queued.resolve(null)
      this.queued = { fen, elo, movetime, resolve }
      this.pump()
    })
  }

  private pump() {
    if (!this.booted || this.busy || !this.queued) return
    const next = this.queued
    this.queued = null
    this.busy = true
    this.job = { fen: next.fen, movetime: next.movetime, resolve: next.resolve }
    if (next.elo === this.elo) {
      this.go()
      return
    }
    this.elo = next.elo
    this.worker?.postMessage(`setoption name UCI_LimitStrength value ${next.elo == null ? "false" : "true"}`)
    if (next.elo != null) this.worker?.postMessage(`setoption name UCI_Elo value ${next.elo}`)
    this.afterReady = () => this.go()
    this.worker?.postMessage("isready")
  }

  private go() {
    if (!this.job) return
    this.worker?.postMessage(`position fen ${this.job.fen}`)
    this.worker?.postMessage(`go movetime ${this.job.movetime}`)
  }

  private onLine(line: string) {
    if (line === "uciok") {
      this.worker?.postMessage("isready")
      return
    }
    if (line === "readyok") {
      if (!this.booted) {
        this.booted = true
        this.pump()
        return
      }
      const resume = this.afterReady
      this.afterReady = null
      resume?.()
      return
    }
    if (!line.startsWith("bestmove") || !this.job) return
    const uci = line.split(/\s+/)[1] ?? ""
    const job = this.job
    this.job = null
    this.busy = false
    if (uci.length < 4 || uci === "(none)") job.resolve(null)
    else job.resolve({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    this.pump()
  }

  private fail() {
    this.job?.resolve(null)
    this.queued?.resolve(null)
    this.job = null
    this.queued = null
    this.busy = false
    this.worker?.terminate()
    this.worker = null
    if (player === this) player = null
  }
}

let player: Player | null = null

export function askStockfish(fen: string, elo: number | null, movetime: number): Promise<StockfishMove | null> {
  if (typeof Worker === "undefined") return Promise.resolve(null)
  player ??= new Player()
  return player.ask(fen, elo, movetime)
}
