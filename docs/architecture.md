# Architecture

Ply is a TanStack Start app. The chess table is client-side. Rules, search, and the opening book do not need the network.

```text
board and side panel          src/components/ply-app.tsx
                              src/components/board.tsx
                              src/components/piece.tsx
        │
        ▼
game store                    src/chess/store.ts          Zustand
        │
        ├── rules             src/chess/rules.ts          results, clocks, material
        ├── openings          src/chess/openings.ts       names and book moves
        └── engine client     src/chess/engine-client.ts
                │
                ▼
            worker            src/chess/engine.worker.ts
                │
                ▼
            search            src/chess/search.ts         book, then alpha-beta
```

The route `/` renders `PlyApp`. The document shell is `src/routes/__root.tsx`.

## State

`useGame` holds one history. Each node is a FEN, the SAN that reached it, the from-square and to-square, and both clocks as they stood at the start of that turn. `index` is the ply on the board. Undo, jump, and loading an opening only move that index or replace the node list. They do not try to unplay a move inside chess.js.

A move is legal when chess.js accepts `{ from, to, promotion }`. The store then appends a node, drops any plies that were ahead of the old index, checks the result, and starts the clock for the next turn.

The engine effect in `PlyApp` runs when it is the engine’s turn. It marks the status `thinking`, asks for a move, and plays it only if the FEN is still the one that was searched. A newer move or a cancelled effect drops the reply.

## Rules module

`outcome` checks checkmate, stalemate, threefold repetition, the fifty-move rule, and insufficient material, in that order. Repetition uses the first four FEN fields (placement, side to move, castling, en passant), so the halfmove clock and move number do not hide a repeat.

`hasMatingMaterial` is only for flag wins. A lone king, king and knight, or king and bishop cannot win on time. A pawn, rook, queen, two bishops, or bishop and knight can.

Captured pieces are the starting set minus what the opponent still has. Promotions can make that list imperfect if a pawn has promoted and another piece of that type was taken. The material number uses the standard pawn-unit values and ignores that edge.

## Board

`Board` is a grid of buttons, one per square. Pointer events handle both tap and drag. A drag that travels paints a ghost piece that follows the pointer. Dropping uses the element under the pointer. Promotion is a dialog over the board. The hint is an SVG arrow in board coordinates.

Pieces are geometric SVG paths in `src/components/piece.tsx`, scaled to the square. They are not a font and not an image sprite.

## Sound

`src/chess/sound.ts` is a single `AudioContext`. Tones are oscillators, not samples. Mute is a flag the store keeps and the header button toggles.

## Persistence

`PlyApp` subscribes to the store and writes JSON to `localStorage` key `ply-table-v1`. On boot it hydrates, then sets `booted`. The engine effect waits for `booted`, so a restored game does not also get a second engine move from the initial empty state. A save with the wrong version, a bad FEN, or more than 500 plies is discarded.

## Shell around the game

The repo also contains the TanStack Start shell this app was built in: router, styles, Vite config, and an auth scaffold. Auth is off. `.grok/app-env.json` sets `VITE_AUTH_ENABLED` to `false`, and `scripts/with-app-env.mjs` puts that into the Vite process. The chess table does not read a user id.

`npm run dev` and `npm run build` go through that wrapper. Starting Vite by hand skips it.

## What is not in the chess path

`src/lib/auth`, `src/lib/db`, and `migrations/` belong to the shell. They are not called when you move a piece. The opening book is a TypeScript array, not a database table.
