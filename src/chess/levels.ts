export type LevelId = "casual" | "club" | "sharp"
export type FishLevelId = "easy" | "solid" | "strong" | "full"
export type OpponentId = "ply" | "stockfish"

export const LEVELS: Record<
  LevelId,
  { label: string; detail: string; depth: number; movetime: number; noise: number }
> = {
  casual: { label: "Casual", detail: "Fast, uneven", depth: 2, movetime: 360, noise: 150 },
  club: { label: "Club", detail: "Looks ahead", depth: 3, movetime: 800, noise: 0 },
  sharp: { label: "Sharp", detail: "Deeper search", depth: 4, movetime: 1400, noise: 0 },
}

export const FISH_LEVELS: Record<FishLevelId, { label: string; detail: string; elo: number | null; movetime: number }> = {
  easy: { label: "Easy", detail: "About 1320", elo: 1320, movetime: 280 },
  solid: { label: "Solid", detail: "About 1800", elo: 1800, movetime: 500 },
  strong: { label: "Strong", detail: "About 2500", elo: 2500, movetime: 800 },
  full: { label: "Full", detail: "No rating cap", elo: null, movetime: 1200 },
}
