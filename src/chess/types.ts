export type EngineMove = {
  from: string
  to: string
  promotion?: "q" | "r" | "b" | "n"
}

export type SearchOpts = {
  depth: number
  movetime: number
  noise: number
  book: boolean
}
