import { findBestMove } from "./search"
import type { EngineMove, SearchOpts } from "./types"

type Request = SearchOpts & { id: number; fen: string }
type Reply = { id: number; move: EngineMove | null; error?: string }

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null
  postMessage: (data: Reply) => void
}

scope.onmessage = (event) => {
  const msg = event.data
  try {
    const move = findBestMove(msg.fen, {
      depth: msg.depth,
      movetime: msg.movetime,
      noise: msg.noise,
      book: msg.book,
    })
    scope.postMessage({ id: msg.id, move })
  } catch (error) {
    const message = error instanceof Error ? error.message : "engine failed"
    scope.postMessage({ id: msg.id, move: null, error: message })
  }
}
