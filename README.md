# Ply

Hybrid chess in the browser. One board, three tables: you against the engine, two people on the same screen, or a study board for a line from the opening book.

![Ply on a desktop, Italian opening in Study](docs/screenshots/desktop.png)

The rules come from [chess.js](https://github.com/jhlywa/chess.js). The opponent is a small alpha-beta engine in a web worker, and it plays the first moves from a named opening book of 87 lines. Nothing is sent to a server. The game lives in this browser.

## Tables

| Table | What you can do |
| --- | --- |
| Engine | Take White or Black. Casual, Club, or Sharp. |
| Two players | Pass the screen. The board can turn after each move. |
| Study | Move either color. Hint asks the engine and does not play. |

Clocks are off, or 5, 10, or 15 minutes. Undo, flip, hint, and resign sit under the board. Tap a ply in the move list to jump there, or copy the position as FEN.

![Ply on a phone](docs/screenshots/mobile.png)

A hint draws an arrow. The opening name and ECO code appear once the moves match a line in the book.

![Hint arrow on the Italian](docs/screenshots/hint.png)

## Documentation

| Guide | What it covers |
| --- | --- |
| [Playing](docs/playing.md) | Input, clocks, promotion, results, sound, saving |
| [Opening book](docs/openings.md) | How names are chosen, how the engine uses the book, full catalog |
| [Engine](docs/engine.md) | Search, evaluation, strength levels, hints |
| [Architecture](docs/architecture.md) | Modules and how a move moves through the app |
| [Development](docs/development.md) | Install, scripts, and local-only state |

## Run it

```bash
npm install
npm run dev
```

The dev server listens on port 8080. There are no accounts. [Development](docs/development.md) has the other scripts.

## Keys

| Key | Action |
| --- | --- |
| `←` | Undo |
| `F` | Flip the board |
| `H` | Hint |

## Stack

React 19, TanStack Start, Tailwind CSS, Zustand, chess.js. Search runs off the main thread. Pieces are drawn as SVG, not a sprite font.
