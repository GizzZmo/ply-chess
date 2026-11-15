export type LevelId = "casual" | "club" | "sharp"

export const LEVELS: Record<
  LevelId,
  { label: string; detail: string; depth: number; movetime: number; noise: number }
> = {
  casual: { label: "Casual", detail: "Fast, uneven", depth: 2, movetime: 360, noise: 150 },
  club: { label: "Club", detail: "Looks ahead", depth: 3, movetime: 800, noise: 0 },
  sharp: { label: "Sharp", detail: "Deeper search", depth: 4, movetime: 1400, noise: 0 },
}
