# Playing

Ply is one board and a side panel. On a phone the panel sits under the board. On a wide window it sits to the right.

## Choosing a table

**Engine.** You play one color. The other color is the engine. Pick White or Black, a strength, and a clock, then restart. Changing side, clock, or table starts a new game. Changing strength does not. It applies on the engine’s next move.

**Two players.** Both sides are human, on one screen. **Turn the board** flips the board to the side about to move, so you can hand the phone across the table. Turn it off to keep White at the bottom.

**Study.** Either color can move. Clocks are hidden. Hint still works, and it only draws an arrow. Loading a line from the [opening book](openings.md) switches the table to Study and leaves you at the end of that line.

The sentence under the table controls describes the current mode.

## Making a move

Tap a piece, then tap a legal square. Or drag the piece. Legal destinations show a dot. A capture shows a ring. The last move stays highlighted. The king’s square is marked when that side is in check.

Only legal moves are accepted. That includes pins, castling through check, en passant, and promotion. You cannot move the opponent’s pieces, and you cannot move while the engine is thinking.

### Promotion

If a pawn reaches the last rank, a dialog asks for queen, rook, bishop, or knight. The move is not finished until you choose. Dismissing the dialog returns the pawn.

### Castling and en passant

These are normal chess.js moves. Castle by moving the king two squares, or by dragging it onto the rook’s side. En passant is offered only on the immediate reply to a two-square pawn move.

## Clocks

Clocks run only in Engine and Two players, and only when a time control is selected. The active clock is brighter. Under 20 seconds it turns red. A flag ends the game, unless the side that still has time does not have enough material to mate. In that case the game is a draw (“Time — not enough material”). Study has no clock.

Time already used on the current turn is stored with the move, so undo and jumping in the move list restore the clocks from that ply.

## Under the board

| Control | Effect |
| --- | --- |
| Undo | One ply back. In Engine, undo skips the engine’s reply and returns to your turn. |
| Hint | Asks the engine for a move and draws an arrow. Disabled while a game is over or the engine is thinking. |
| Flip | Swaps which color is at the bottom. |
| Resign | Press once, then press **Sure?** within a few seconds. In Engine, you resign, so the engine wins. In Two players, the side to move resigns. Study has no resign. |

The move list is the whole game. The highlighted ply is the one on the board. **Copy position** copies the current FEN.

## Who is who

In Engine the bars say **You** and **Engine**. In the other tables they say **White** and **Black**. Captured pieces sit next to the side that took them, and a small `+n` is the material lead in pawn units (queen 9, rook 5, bishop 3, knight 3, pawn 1).

## Results

| Ending | What you see |
| --- | --- |
| Checkmate | The side that delivered mate wins. |
| Stalemate | Draw. |
| Threefold repetition | Draw. Counted along the line you actually played, including jumps back. |
| Fifty-move rule | Draw. |
| Insufficient material | Draw. |
| Resignation | The other side wins. |
| Time | The other side wins, unless they cannot force mate. |

## Sound

The header button mutes move sounds. The first tap anywhere unlocks audio, which browsers require. A quiet tone is a quiet move, a lower tone is a capture, a two-note rise is check, and a falling pair is the end of the game. Mute is remembered with the game.

## Keys

| Key | Action |
| --- | --- |
| `←` | Undo |
| `F` | Flip |
| `H` | Hint |

Keys are ignored while you are typing in the opening search.

## Saving

The current game is written to `localStorage` under `ply-table-v1` whenever it changes. Refreshing the page restores the line, the table, the clock, the strength, the orientation, and mute. A broken save is ignored and a new game starts. There is no account and no server copy.

Clear the site’s storage for this origin if you want a fresh board and the old game keeps coming back.
