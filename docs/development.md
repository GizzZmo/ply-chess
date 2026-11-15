# Development

## Requirements

Node.js 22 or current LTS. A browser that can run a module web worker. No database is required to play.

## Install and run

```bash
npm install
npm run dev
```

The dev server binds `0.0.0.0:8080`. Open `http://127.0.0.1:8080/`.

`npm run dev` is wrapped by `scripts/with-app-env.mjs`, which reads `.grok/app-env.json` and exports `VITE_` keys. This repo ships that file with `VITE_AUTH_ENABLED` set to `false`. If the file is missing, the shell treats auth as on. Keep the file if you want the chess table by itself.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 8080 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build, then the local migrate script |
| `npm run preview` | Serve the production build |
| `npm test` | Shell unit tests. They do not play chess |
| `npm run lint` | ESLint |

`build` runs `db:migrate` because the shell has a migration runner. With auth off and no `DATABASE_URL`, that step is a no-op for the chess table. You do not need Postgres to work on the game.

## Where to change things

| You want to… | Edit |
| --- | --- |
| Add an opening | `src/chess/openings.ts`, then check the line is legal SAN |
| Change strength | `src/chess/levels.ts` |
| Change search or eval | `src/chess/search.ts` |
| Change mate, draws, clocks, material | `src/chess/rules.ts` |
| Change what a click does | `src/chess/store.ts` and `src/components/board.tsx` |
| Change the side panel | `src/components/ply-app.tsx` |

Opening moves are SAN, the same way chess.js prints them (`Nf3`, `O-O`, `exd5`, `Bxc6`). A bad SAN throws when the module loads, so a broken line fails immediately instead of shipping a hole in the book.

## Checking a line

From the repo root:

```bash
node --experimental-strip-types -e '
import { Chess } from "chess.js"
import { OPENINGS, matchOpening } from "./src/chess/openings.ts"
for (const line of OPENINGS) {
  const chess = new Chess()
  for (const san of line.moves) {
    const move = chess.move(san)
    if (!move || move.san !== san) throw new Error(line.name + " " + san)
  }
}
console.log(OPENINGS.length, "lines ok", matchOpening(["e4","c5"])?.name)
'
```

That should print `87 lines ok Sicilian Defense`.

## State and storage

Games are not in git and not on a server. The browser key is `ply-table-v1`. The shape is the store fields plus `v: 1`. Bump `v` in `ply-app.tsx` and the check in `hydrate` if you change that shape, or old browsers will load a game the new code does not understand.

## Production build

```bash
npm run build
npm run preview
```

The preview port is 8081 in this project’s preview script. The dev server can keep running on 8080.

## Layout of this repo

`src/chess` and `src/components` are the game. `src/routes` is the page. `docs/` is this documentation. `public/` holds the favicon and share images.

`node_modules/`, local screenshots from QA, and the rest of `.grok/` are gitignored. `.grok/app-env.json` is not ignored, on purpose.
