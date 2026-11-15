# Opening book

The book is 87 named lines in `src/chess/openings.ts`. It is not the Encyclopaedia of Chess Openings and it is not a master-game database. Each line is a SAN sequence from the starting position. ECO codes are the usual labels for those lines, so you can look them up elsewhere. They are not computed.

The in-app **Openings** list searches that file. Tap a line and the board switches to Study at the end of it. Step backward through the move list to see how it was reached. One-move entries (`e4`, `d4`, `c4`, `Nf3`, `f4`, `b3`) stay out of the default list so it is not only first moves. They still match a search, and they still name the position after that move.

## How a position gets a name

The name on the board is the longest line whose moves are exactly the start of the game you played.

After `1.e4 e5 2.Nf3 Nc6 3.Bc4` the name is **Italian Game**. After `3...Bc5` it becomes **Giuoco Piano**, because that line is longer and still matches. A different fourth move, such as `3...Nf6`, matches **Two Knights Defense** instead. If you leave every line, the last name that fully matched stays until a longer one fits. The label **Out of book** appears only when nothing in the file matches and the position also has no book reply.

Names follow the move order you played, not a transposition table. `1.e4 e5 2.Nf3 Nc6 3.Bb5` is the Ruy Lopez. The same piece placement reached by another order keeps whatever name matches that order, or no name.

## How the engine uses it

Every position along every line stores the next book move. If two lines disagree, both moves are kept. From `1.e4 e5 2.Nf3 Nc6` the book offers `Bb5`, `Bc4`, `d4`, and `Nc3` (Ruy Lopez, Italian, Scotch, Four Knights). The engine picks one of them at random.

While a book move exists, Club and Sharp play it and do not search. Casual skips the book about a third of the time and searches instead, which is why Casual games leave theory sooner.

The line under the opening name, **Book · …**, lists those replies for the position on the board. It is the same list the engine chooses from. When you are in Study, the list is only information. Hint never plays a book move on purpose. Hint always asks the search.

Book moves are checked when the module loads. An illegal SAN throws, so the worker will not start with a broken line.

## Adding a line

Add an object to `OPENINGS`:

```ts
{ eco: "C50", name: "Giuoco Pianissimo", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3"] }
```

Use chess.js SAN, including `O-O` and capture notation such as `exd5`. A longer line should begin with the same moves as the shorter line it belongs to, or the name will not take over when you play it. Restart the dev server after editing the file if the worker has already been created. Workers keep the old module until the page is reloaded.

## Catalog

Counts below are the lines in the source, grouped by White’s first move.

### King pawn

| ECO | Opening | Moves |
| --- | --- | --- |
| C20 | King's Pawn Game | `e4` |
| C20 | Open Game | `e4 e5` |
| C40 | King's Knight Opening | `e4 e5 Nf3` |
| C44 | King's Knight, 2...Nc6 | `e4 e5 Nf3 Nc6` |
| C60 | Ruy Lopez | `e4 e5 Nf3 Nc6 Bb5` |
| C70 | Ruy Lopez, Morphy Defense | `e4 e5 Nf3 Nc6 Bb5 a6` |
| C69 | Ruy Lopez, Exchange | `e4 e5 Nf3 Nc6 Bb5 a6 Bxc6` |
| C78 | Ruy Lopez, 5.Ba4 | `e4 e5 Nf3 Nc6 Bb5 a6 Ba4` |
| C65 | Ruy Lopez, Berlin Defense | `e4 e5 Nf3 Nc6 Bb5 Nf6` |
| C84 | Ruy Lopez, Closed | `e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7` |
| C92 | Ruy Lopez, Chigorin | `e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O` |
| C89 | Ruy Lopez, Marshall Attack | `e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5` |
| C50 | Italian Game | `e4 e5 Nf3 Nc6 Bc4` |
| C50 | Giuoco Piano | `e4 e5 Nf3 Nc6 Bc4 Bc5` |
| C55 | Two Knights Defense | `e4 e5 Nf3 Nc6 Bc4 Nf6` |
| C57 | Fried Liver Attack | `e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5` |
| C51 | Evans Gambit | `e4 e5 Nf3 Nc6 Bc4 Bc5 b4` |
| C45 | Scotch Game | `e4 e5 Nf3 Nc6 d4` |
| C45 | Scotch, 4...exd4 | `e4 e5 Nf3 Nc6 d4 exd4` |
| C47 | Four Knights Game | `e4 e5 Nf3 Nc6 Nc3 Nf6` |
| C30 | King's Gambit | `e4 e5 f4` |
| C33 | King's Gambit Accepted | `e4 e5 f4 exf4` |
| C25 | Vienna Game | `e4 e5 Nc3` |
| C41 | Philidor Defense | `e4 e5 Nf3 d6` |
| C42 | Petrov Defense | `e4 e5 Nf3 Nf6` |
| C42 | Petrov, 3.Nxe5 | `e4 e5 Nf3 Nf6 Nxe5` |
| B20 | Sicilian Defense | `e4 c5` |
| B90 | Sicilian Najdorf | `e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6` |
| B70 | Sicilian Dragon | `e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6` |
| B80 | Sicilian Scheveningen | `e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6` |
| B56 | Sicilian Classical | `e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6` |
| B33 | Sicilian Sveshnikov | `e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5` |
| B34 | Sicilian Accelerated Dragon | `e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6` |
| B41 | Sicilian Kan | `e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6` |
| B48 | Sicilian Taimanov | `e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6` |
| B22 | Sicilian Alapin | `e4 c5 c3` |
| B21 | Sicilian Smith-Morra Gambit | `e4 c5 d4` |
| B23 | Sicilian Closed | `e4 c5 Nc3` |
| C00 | French Defense | `e4 e6` |
| C02 | French Advance | `e4 e6 d4 d5 e5` |
| C02 | French Advance, 3...c5 | `e4 e6 d4 d5 e5 c5` |
| C03 | French Tarrasch | `e4 e6 d4 d5 Nd2` |
| C15 | French Winawer | `e4 e6 d4 d5 Nc3 Bb4` |
| C11 | French Classical | `e4 e6 d4 d5 Nc3 Nf6` |
| C01 | French Exchange | `e4 e6 d4 d5 exd5` |
| B10 | Caro-Kann Defense | `e4 c6` |
| B12 | Caro-Kann Advance | `e4 c6 d4 d5 e5` |
| B18 | Caro-Kann Classical | `e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5` |
| B13 | Caro-Kann Exchange | `e4 c6 d4 d5 exd5` |
| B14 | Caro-Kann Panov | `e4 c6 d4 d5 exd5 cxd5 c4` |
| B07 | Pirc Defense | `e4 d6` |
| B08 | Pirc, Classical | `e4 d6 d4 Nf6 Nc3 g6` |
| B06 | Modern Defense | `e4 g6` |
| B02 | Alekhine Defense | `e4 Nf6` |
| B03 | Alekhine, Modern | `e4 Nf6 e5 Nd5 d4` |
| B01 | Scandinavian Defense | `e4 d5` |
| B01 | Scandinavian, 2...Qxd5 | `e4 d5 exd5 Qxd5` |

### Queen pawn

| ECO | Opening | Moves |
| --- | --- | --- |
| D00 | Queen's Pawn Game | `d4` |
| D06 | Queen's Gambit | `d4 d5 c4` |
| D30 | Queen's Gambit Declined | `d4 d5 c4 e6` |
| D37 | QGD, Orthodox | `d4 d5 c4 e6 Nc3 Nf6 Nf3 Be7` |
| D35 | QGD Exchange | `d4 d5 c4 e6 Nc3 Nf6 cxd5` |
| D20 | Queen's Gambit Accepted | `d4 d5 c4 dxc4` |
| D10 | Slav Defense | `d4 d5 c4 c6` |
| D43 | Semi-Slav Defense | `d4 d5 c4 c6 Nf3 Nf6 Nc3 e6` |
| E20 | Nimzo-Indian Defense | `d4 Nf6 c4 e6 Nc3 Bb4` |
| E32 | Nimzo-Indian, Classical | `d4 Nf6 c4 e6 Nc3 Bb4 Qc2` |
| E12 | Queen's Indian Defense | `d4 Nf6 c4 e6 Nf3 b6` |
| E00 | Catalan Opening | `d4 Nf6 c4 e6 g3` |
| E60 | King's Indian Defense | `d4 Nf6 c4 g6` |
| E90 | King's Indian, Classical | `d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3` |
| D80 | Grünfeld Defense | `d4 Nf6 c4 g6 Nc3 d5` |
| D85 | Grünfeld Exchange | `d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5` |
| A70 | Modern Benoni | `d4 Nf6 c4 c5 d5 e6` |
| A57 | Benko Gambit | `d4 Nf6 c4 c5 d5 b5` |
| A80 | Dutch Defense | `d4 f5` |
| A96 | Dutch Leningrad | `d4 f5 c4 Nf6 g3 g6` |
| D02 | London System | `d4 d5 Nf3 Nf6 Bf4` |
| A45 | Trompowsky Attack | `d4 Nf6 Bg5` |

### English, Réti, and the flanks

| ECO | Opening | Moves |
| --- | --- | --- |
| A10 | English Opening | `c4` |
| A30 | English Symmetrical | `c4 c5` |
| A20 | English, 1...e5 | `c4 e5` |
| A04 | Réti Opening | `Nf3` |
| A09 | Réti, 1...d5 | `Nf3 d5` |
| A07 | King's Indian Attack | `Nf3 d5 g3` |
| A02 | Bird Opening | `f4` |
| A01 | Nimzo-Larsen Attack | `b3` |
