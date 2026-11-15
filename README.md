# Ply

Hybrid chess in the browser. Play an engine, pass one screen between two people, or study a line.

![Ply on a desktop, Italian opening in Study](docs/screenshots/desktop.png)

## How to play

| Table | What it does |
| --- | --- |
| Engine | You take White or Black. The other side is the engine. |
| Two players | Same screen. The board can turn after each move. |
| Study | Move either color. Hint asks the engine and does not play the move. |

Strength is Casual, Club, or Sharp. Clocks are off, or 5, 10, or 15 minutes. Undo, flip, and resign sit under the board. The move list jumps back to any ply, and the position can be copied as FEN. The game is saved in this browser.

![Ply on a phone](docs/screenshots/mobile.png)

Hint draws the engine’s suggestion on the board.

![Hint arrow on the Italian](docs/screenshots/hint.png)

## Keys

- `←` undo
- `F` flip the board
- `H` hint

## Run it

```bash
npm install
npm run dev
```

The dev server listens on port 8080. There are no accounts. `.grok/app-env.json` keeps auth off for local dev.

## Stack

React 19, TanStack Start, Tailwind, Zustand, and [chess.js](https://github.com/jhlywa/chess.js). Search runs in a web worker in the browser.
