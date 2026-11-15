# Engine

The opponent is local. `askEngine` in `src/chess/engine-client.ts` posts the FEN to a web worker (`src/chess/engine.worker.ts`). The worker calls `findBestMove` in `src/chess/search.ts`. If the worker fails or runs past the time budget, the same search runs on the main thread at a shallower depth so the game still moves.

Hint uses the same search with the book turned off, depth 3, and no noise. It stores an arrow. It does not play the move.

## Opening book first

When the book is on and the position is in it, the engine plays a book move and does not search. If several replies are in the book, it picks one at random, so the same position does not always continue the same way. See [Opening book](openings.md).

On Casual, about one move in three ignores the book even when a book move exists. Club and Sharp stay in the book until the position leaves it.

## Search

After the book, search is iterative-deepening negamax with alpha-beta.

1. Generate legal moves with chess.js.
2. Order them. Captures use most-valuable-victim minus attacker, then promotions, then checks, then castling.
3. Search from depth 1 up to the level’s depth, reusing the previous ordering.
4. At depth 0, quiescence looks at captures and promotions, or every move when in check, up to 4 plies. A stand-pat score lets a quiet position stop early.
5. A deadline (`movetime`) throws out of the search. A finished depth replaces the best move. A depth that times out keeps the last finished depth.

A single legal move is returned immediately. Checkmate and stalemate return no move. Fifty-move and insufficient-material positions score as 0 inside the tree.

Mate scores are large and shifted by depth, so a shorter mate is preferred.

## Evaluation

The score is from White’s point of view, then flipped for the side to move.

| Piece | Value |
| --- | --- |
| Pawn | 100 |
| Knight | 320 |
| Bishop | 330 |
| Rook | 500 |
| Queen | 900 |

Each piece also has a piece-square table. Kings use a different table when no queens are left. A bishop pair adds 30. There is no pawn-structure or king-safety term beyond those tables, so the engine is a club player, not a tournament engine.

## Strength

| Level | Depth | Time budget | Book |
| --- | --- | --- | --- |
| Casual | 2 | 360 ms | Sometimes skipped |
| Club | 3 | 800 ms | Always, while the position is in the book |
| Sharp | 4 | 1400 ms | Always, while the position is in the book |

Casual also adds noise after the search. Moves within 150 centipawns of the best score are treated as equal, and one of them is chosen at random. Club and Sharp play the best score.

The UI label is the level name. The detail line under the controls (“Fast, uneven”, “Looks ahead”, “Deeper search”) comes from the same table in `src/chess/levels.ts`.

## What it will not do

It does not use an endgame tablebase, an opening file such as Polyglot, or a remote engine. It does not ponder on your time. It does not resign on its own. When its clock hits zero it loses on time, same as you.
