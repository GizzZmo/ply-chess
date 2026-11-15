import type { EngineMove, SearchOpts } from "./types"

type Reply = { id: number; move?: EngineMove | null; error?: string }

let worker: Worker | null = null
let seq = 0
const pending = new Map<
  number,
  { resolve: (move: EngineMove | null) => void; reject: (error: Error) => void; timer: number }
>()

function failAll(error: Error) {
  for (const waiter of pending.values()) {
    window.clearTimeout(waiter.timer)
    waiter.reject(error)
  }
  pending.clear()
}

function ensureWorker(): Worker {
  if (worker) return worker
  const next = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" })
  next.onmessage = (event: MessageEvent<Reply>) => {
    const data = event.data
    const waiter = pending.get(data.id)
    if (!waiter) return
    pending.delete(data.id)
    window.clearTimeout(waiter.timer)
    if (data.error) waiter.reject(new Error(data.error))
    else waiter.resolve(data.move ?? null)
  }
  next.onerror = () => {
    failAll(new Error("Chess engine stopped."))
    next.terminate()
    if (worker === next) worker = null
  }
  worker = next
  return next
}

async function fallback(fen: string, opts: SearchOpts): Promise<EngineMove | null> {
  const { findBestMove } = await import("./search")
  return findBestMove(fen, {
    ...opts,
    depth: Math.min(opts.depth, 2),
    movetime: Math.min(opts.movetime, 280),
  })
}

export function askEngine(fen: string, opts: SearchOpts): Promise<EngineMove | null> {
  if (typeof window === "undefined" || typeof Worker === "undefined") return fallback(fen, opts)
  try {
    const engine = ensureWorker()
    const id = ++seq
    const call = new Promise<EngineMove | null>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pending.delete(id)
        engine.terminate()
        if (worker === engine) worker = null
        reject(new Error("Chess engine timed out."))
      }, opts.movetime + 2500)
      pending.set(id, { resolve, reject, timer })
      engine.postMessage({ id, fen, ...opts })
    })
    return call.catch(() => fallback(fen, opts))
  } catch {
    return fallback(fen, opts)
  }
}
