import { Chess, type Color } from "chess.js"
import { ArrowDownUp, Flag, Lightbulb, RotateCcw, Undo2, Volume2, VolumeX } from "lucide-react"
import { type ReactNode, useEffect, useState } from "react"
import { askEngine } from "@/chess/engine-client"
import { LEVELS, type LevelId } from "@/chess/levels"
import { capturedBy, formatClock, materialForWhite, sideToMove } from "@/chess/rules"
import { setMuted, unlockAudio } from "@/chess/sound"
import { useGame, type Mode } from "@/chess/store"
import { Board } from "@/components/board"
import { PieceSvg } from "@/components/piece"

const SAVE_KEY = "ply-table-v1"

const MODES: { id: Mode; label: string }[] = [
  { id: "engine", label: "Engine" },
  { id: "pass", label: "Two players" },
  { id: "study", label: "Study" },
]

const CLOCKS = [
  { id: 0, label: "Off" },
  { id: 5, label: "5" },
  { id: 10, label: "10" },
  { id: 15, label: "15" },
]

export function PlyApp() {
  const booted = useGame((s) => s.booted)
  const index = useGame((s) => s.index)
  const fen = useGame((s) => s.nodes[s.index]?.fen ?? "")
  const mode = useGame((s) => s.mode)
  const humanColor = useGame((s) => s.humanColor)
  const level = useGame((s) => s.level)
  const mute = useGame((s) => s.mute)

  useEffect(() => {
    const unsub = useGame.subscribe((state) => {
      if (!state.booted) return
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            v: 1,
            nodes: state.nodes,
            index: state.index,
            orientation: state.orientation,
            mode: state.mode,
            humanColor: state.humanColor,
            level: state.level,
            minutes: state.minutes,
            autoFlip: state.autoFlip,
            mute: state.mute,
            status: state.status === "thinking" ? "playing" : state.status,
            result: state.result,
          }),
        )
      } catch {
        /* storage unavailable */
      }
    })
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) useGame.getState().hydrate(JSON.parse(raw))
    } catch {
      /* ignore broken saves */
    }
    useGame.getState().boot()
    return () => unsub()
  }, [])

  useEffect(() => {
    setMuted(mute)
  }, [mute])

  useEffect(() => {
    if (!booted || mode !== "engine") return
    const state = useGame.getState()
    if (state.status === "gameover") return
    const current = state.nodes[state.index]?.fen
    if (!current) return
    let chess: Chess
    try {
      chess = new Chess(current)
    } catch {
      return
    }
    if (chess.isGameOver() || chess.turn() === state.humanColor) return
    let cancelled = false
    useGame.setState({ status: "thinking", selected: null, pending: null })
    const spec = LEVELS[state.level]
    void askEngine(current, {
      depth: spec.depth,
      movetime: spec.movetime,
      noise: spec.noise,
      book: true,
    }).then((move) => {
      if (cancelled) return
      const next = useGame.getState()
      if (next.nodes[next.index]?.fen !== current) return
      if (!move) {
        if (next.status === "thinking") useGame.setState({ status: "playing" })
        return
      }
      next.applyEngine(move.from, move.to, move.promotion)
    })
    return () => {
      cancelled = true
      const next = useGame.getState()
      if (next.status === "thinking" && next.nodes[next.index]?.fen === current) {
        useGame.setState({ status: "playing" })
      }
    }
  }, [booted, mode, humanColor, level, index, fen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest("input, textarea")) return
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        useGame.getState().undo()
      } else if (event.key === "f" || event.key === "F") {
        useGame.getState().flip()
      } else if (event.key === "h" || event.key === "H") {
        void useGame.getState().hintMove()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="app-pad min-h-dvh bg-bg text-fg" onPointerDown={() => unlockAudio()}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 grid-cols-2 overflow-hidden rounded-sm" aria-hidden>
            <span className="bg-board-light" />
            <span className="bg-board-dark" />
            <span className="bg-board-dark" />
            <span className="bg-board-light" />
          </span>
          <div>
            <h1 className="font-display text-xl leading-none tracking-tight">Ply</h1>
            <p className="mt-1 text-sm text-muted">Hybrid chess</p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md bg-subtle text-fg"
          aria-label={mute ? "Unmute" : "Mute"}
          aria-pressed={mute}
          onClick={() => {
            unlockAudio()
            useGame.getState().toggleMute()
          }}
        >
          {mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:px-6">
        <section className="flex flex-col items-center gap-3">
          <div className="board-size flex flex-col gap-2">
            <PlayerBar place="top" />
            <Board />
            <PlayerBar place="bottom" />
            <StatusLine />
            <ResultCard />
            <Actions />
          </div>
        </section>
        <aside className="panel-scroll flex flex-col gap-4 rounded-xl bg-elevated p-4">
          <TableSettings />
          <MoveList />
        </aside>
      </main>
    </div>
  )
}

function PlayerBar({ place }: { place: "top" | "bottom" }) {
  const orientation = useGame((s) => s.orientation)
  const color: Color = place === "bottom" ? orientation : orientation === "w" ? "b" : "w"
  const fen = useGame((s) => s.nodes[s.index]?.fen ?? "")
  const mode = useGame((s) => s.mode)
  const humanColor = useGame((s) => s.humanColor)
  const status = useGame((s) => s.status)
  const turn = sideToMove(fen)
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch {
    chess = new Chess()
  }
  const caps = capturedBy(chess, color)
  const ahead = materialForWhite(chess)
  const delta = color === "w" ? ahead : -ahead
  const active = status !== "gameover" && turn === color
  const thinking = status === "thinking" && mode === "engine" && color !== humanColor && active
  const name =
    mode === "engine" ? (color === humanColor ? "You" : "Engine") : color === "w" ? "White" : "Black"

  return (
    <div className={`flex h-11 items-center justify-between gap-3 ${active ? "text-fg" : "text-muted"}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-sm font-medium ${thinking ? "thinking" : ""}`}>{name}</span>
        <span className="flex min-w-0 items-center">
          {caps.map((type, i) => (
            <PieceSvg key={`${type}-${i}`} color={color === "w" ? "b" : "w"} type={type} className="h-4 w-4 shrink-0" />
          ))}
        </span>
        {delta > 0 ? <span className="text-xs tabular-nums text-muted">+{delta}</span> : null}
      </div>
      <Clock color={color} active={active} />
    </div>
  )
}

function Clock({ color, active }: { color: Color; active: boolean }) {
  const minutes = useGame((s) => s.minutes)
  const mode = useGame((s) => s.mode)
  const clocks = useGame((s) => s.nodes[s.index]?.clocks ?? { w: 0, b: 0 })
  const started = useGame((s) => s.turnStartedAt)
  const status = useGame((s) => s.status)
  const running = minutes > 0 && mode !== "study" && status !== "gameover" && active && started != null
  const now = useTicker(running)
  const remain = running && now && started ? clocks[color] - (now - started) : clocks[color]

  useEffect(() => {
    if (running && remain <= 0) useGame.getState().flag(color)
  }, [running, remain, color])

  if (minutes === 0 || mode === "study") return null
  const low = remain < 20_000 && running
  return (
    <span className={`tabular-nums text-sm font-medium ${low ? "text-danger" : ""} ${active ? "" : "opacity-60"}`}>
      {formatClock(remain)}
    </span>
  )
}

function useTicker(on: boolean) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!on) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [on])
  return now
}

function StatusLine() {
  const fen = useGame((s) => s.nodes[s.index]?.fen ?? "")
  const mode = useGame((s) => s.mode)
  const human = useGame((s) => s.humanColor)
  const status = useGame((s) => s.status)
  const result = useGame((s) => s.result)
  const turn = sideToMove(fen)
  const inCheck = (() => {
    try {
      return new Chess(fen).isCheck()
    } catch {
      return false
    }
  })()
  let text = turn === "w" ? "White to move" : "Black to move"
  if (result) text = result.detail
  else if (status === "thinking" && mode === "engine" && turn !== human) text = "Engine is thinking"
  else if (status === "thinking") text = "Looking ahead"
  else if (inCheck) text = turn === "w" ? "White is in check" : "Black is in check"
  else if (mode === "engine" && turn === human) text = "Your move"
  return (
    <p className="text-center text-sm text-muted" aria-live="polite">
      {text}
    </p>
  )
}

function ResultCard() {
  const result = useGame((s) => s.result)
  if (!result) return null
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-3 text-center">
      <p className="font-display text-xl leading-tight">{result.title}</p>
      <p className="mt-1 text-sm text-muted">{result.detail}</p>
    </div>
  )
}

function Actions() {
  const index = useGame((s) => s.index)
  const status = useGame((s) => s.status)
  const mode = useGame((s) => s.mode)
  const confirm = useGame((s) => s.confirmResign)
  const locked = status !== "playing"

  useEffect(() => {
    if (!confirm) return
    const id = window.setTimeout(() => {
      if (useGame.getState().confirmResign) useGame.setState({ confirmResign: false })
    }, 3200)
    return () => window.clearTimeout(id)
  }, [confirm])

  return (
    <div className="grid grid-cols-4 gap-2">
      <ToolButton label="Undo" disabled={index === 0} onClick={() => useGame.getState().undo()}>
        <Undo2 className="size-4" />
      </ToolButton>
      <ToolButton label="Hint" disabled={locked} onClick={() => void useGame.getState().hintMove()}>
        <Lightbulb className="size-4" />
      </ToolButton>
      <ToolButton label="Flip" onClick={() => useGame.getState().flip()}>
        <ArrowDownUp className="size-4" />
      </ToolButton>
      <ToolButton
        label={confirm ? "Sure?" : "Resign"}
        disabled={status === "gameover" || mode === "study"}
        onClick={() => {
          const game = useGame.getState()
          if (!game.confirmResign) game.armResign()
          else game.resign()
        }}
      >
        <Flag className="size-4" />
      </ToolButton>
    </div>
  )
}

function ToolButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 flex-col items-center justify-center gap-1 rounded-md bg-subtle text-xs font-medium text-fg disabled:opacity-40"
    >
      {children}
      {label}
    </button>
  )
}

function TableSettings() {
  const mode = useGame((s) => s.mode)
  const human = useGame((s) => s.humanColor)
  const level = useGame((s) => s.level)
  const minutes = useGame((s) => s.minutes)
  const autoFlip = useGame((s) => s.autoFlip)
  const blurb =
    mode === "engine"
      ? "You play one color. The engine takes the other."
      : mode === "pass"
        ? "Same screen. The board can turn after each move."
        : "Move either color. Hint asks the engine without playing."

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium">Table</h2>
        <p className="mt-1 text-sm text-muted">{blurb}</p>
      </div>
      <Choice
        label="Play"
        value={mode}
        options={MODES}
        onChange={(id) => useGame.getState().setMode(id)}
      />
      {mode === "engine" ? (
        <Choice
          label="You play"
          value={human}
          options={[
            { id: "w" as const, label: "White" },
            { id: "b" as const, label: "Black" },
          ]}
          onChange={(id) => useGame.getState().setHumanColor(id)}
        />
      ) : null}
      {mode === "engine" ? (
        <Choice
          label="Strength"
          value={level}
          options={(Object.keys(LEVELS) as LevelId[]).map((id) => ({ id, label: LEVELS[id].label }))}
          onChange={(id) => useGame.getState().setLevel(id)}
        />
      ) : null}
      {mode !== "study" ? (
        <Choice
          label="Minutes"
          value={minutes}
          options={CLOCKS}
          onChange={(id) => useGame.getState().setMinutes(id)}
        />
      ) : null}
      {mode === "pass" ? (
        <button
          type="button"
          role="switch"
          aria-checked={autoFlip}
          onClick={() => useGame.getState().setAutoFlip(!autoFlip)}
          className="flex h-11 items-center justify-between rounded-md bg-subtle px-3 text-sm"
        >
          <span>Turn the board</span>
          <span className={`h-5 w-9 rounded-full p-0.5 ${autoFlip ? "bg-accent" : "bg-border"}`}>
            <span className={`block h-4 w-4 rounded-full bg-bg ${autoFlip ? "translate-x-4" : ""}`} />
          </span>
        </button>
      ) : null}
      <p className="text-xs text-faint">
        {mode === "engine" ? `${LEVELS[level].detail}. ` : ""}
        Side, clock, and table start a new game. Strength changes on the next engine move.
      </p>
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-sm font-medium text-accent-fg"
        onClick={() => useGame.getState().startGame()}
      >
        <RotateCcw className="size-4" />
        Restart
      </button>
    </div>
  )
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (id: T) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid gap-1 rounded-lg bg-subtle p-1 ${options.length >= 4 ? "grid-cols-4" : options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
      >
        {options.map((option) => {
          const on = option.id === value
          return (
            <button
              key={String(option.id)}
              type="button"
              role="radio"
              aria-checked={on}
              className={`flex h-11 items-center justify-center rounded-md px-1 text-center text-xs font-medium leading-tight ${on ? "bg-accent text-accent-fg" : "text-muted"}`}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MoveList() {
  const nodes = useGame((s) => s.nodes)
  const index = useGame((s) => s.index)
  const [copied, setCopied] = useState(false)
  const pairs: { n: number; w?: number; b?: number }[] = []
  for (let i = 1; i < nodes.length; i += 2) {
    pairs.push({ n: pairs.length + 1, w: i, b: nodes[i + 1] ? i + 1 : undefined })
  }
  const fen = nodes[index]?.fen ?? ""

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Moves</h2>
        <button
          type="button"
          className="h-8 rounded-md px-2 text-xs text-muted"
          onClick={() => {
            void navigator.clipboard?.writeText(fen).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1200)
            })
          }}
        >
          {copied ? "Copied" : "Copy position"}
        </button>
      </div>
      {pairs.length === 0 ? (
        <p className="text-sm text-muted">No moves yet.</p>
      ) : (
        <ol className="max-h-64 overflow-auto">
          {pairs.map((pair) => (
            <li key={pair.n} className="grid grid-cols-[2rem_1fr_1fr] items-center">
              <span className="text-xs tabular-nums text-faint">{pair.n}</span>
              <PlyButton node={pair.w} current={index} san={pair.w != null ? nodes[pair.w]?.san : null} />
              <PlyButton node={pair.b} current={index} san={pair.b != null ? nodes[pair.b]?.san : null} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function PlyButton({ node, current, san }: { node?: number; current: number; san?: string | null }) {
  if (node == null || !san) return <span />
  const on = node === current
  return (
    <button
      type="button"
      onClick={() => useGame.getState().jump(node)}
      className={`h-8 rounded-sm px-2 text-left text-sm tabular-nums ${on ? "bg-subtle text-fg" : "text-muted"}`}
    >
      {san}
    </button>
  )
}
