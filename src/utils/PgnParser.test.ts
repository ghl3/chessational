import { describe } from "node:test";
import { parsePgnStringToChapters } from "./PgnParser";

const pgnFischerSpassky = `[Event "F/S Return Match"]
[Site "Belgrade, Serbia JUG"]
[Date "1992.11.04"]
[Round "29"]
[White "Fischer, Robert J."]
[Black "Spassky, Boris V."]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 {This opening is called the Ruy Lopez.}
4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7
11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5
Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6
23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5
hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5
35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6
Nf2 42. g4 Bd3 43. Re6 1/2-1/2`;

describe("PgnParser", () => {
  it("should parse a linear PGN", () => {
    const tree = parsePgnStringToChapters(pgnFischerSpassky);
    expect(tree.length).toEqual(1);
  });

  it("should parse a simple pgn with alternate move", () => {
    const pgn = `[Foo "Bar"]
    1. e4 e5 2. Nf3 Nc6 (Nf6) *`;
    const chapterAndTrees = parsePgnStringToChapters(pgn);
    expect(chapterAndTrees).toEqual([
      {
        name: "",
        studyName: "",
        chapterIndex: 0,
        orientation: "w",
        headers: {
          Foo: "Bar",
        },
        comments: [],
        positionTree: {
          position: {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            lastMove: null,
            comments: [],
            isGameOver: false,
          },
          children: [
            {
              position: {
                fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                lastMove: {
                  player: "w",
                  piece: "p",
                  from: "e2",
                  to: "e4",
                  san: "e4",
                },
                comments: [],
                isGameOver: false,
                gameResult: "UNKNOWN",
              },
              children: [
                {
                  position: {
                    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                    lastMove: {
                      player: "b",
                      piece: "p",
                      from: "e7",
                      to: "e5",
                      san: "e5",
                    },
                    comments: [],
                    isGameOver: false,
                    gameResult: "UNKNOWN",
                  },
                  children: [
                    {
                      position: {
                        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
                        lastMove: {
                          player: "w",
                          piece: "n",
                          from: "g1",
                          to: "f3",
                          san: "Nf3",
                        },
                        comments: [],
                        isGameOver: false,
                        gameResult: "UNKNOWN",
                      },
                      children: [
                        {
                          position: {
                            fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                            lastMove: {
                              player: "b",
                              piece: "n",
                              from: "b8",
                              to: "c6",
                              san: "Nc6",
                            },
                            comments: [],
                            isGameOver: false,
                            gameResult: "UNKNOWN",
                          },
                          children: [],
                        },
                        {
                          position: {
                            fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                            lastMove: {
                              player: "b",
                              piece: "n",
                              from: "g8",
                              to: "f6",
                              san: "Nf6",
                            },
                            comments: [],
                            isGameOver: false,
                            gameResult: "UNKNOWN",
                          },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]);
  });

  it("should parse a nested pgn with comments", () => {
    const pgn = `[Foo "Bar"]
    1. e4 e5 {The standard response}
    2. Nf3 Nc6 {Defending the pawn} (Nf6 {Going into the Petrov} 3. Nxe5) 3. Bb5 {The Ruy Lopez} *`;
    const tree = parsePgnStringToChapters(pgn);
    expect(tree).toEqual([
      {
        name: "",
        studyName: "",
        chapterIndex: 0,
        orientation: "w",
        headers: {
          Foo: "Bar",
        },
        comments: [],
        positionTree: {
          position: {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            lastMove: null,
            comments: [],
            isGameOver: false,
          },
          children: [
            {
              position: {
                fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                lastMove: {
                  player: "w",
                  piece: "p",
                  from: "e2",
                  to: "e4",
                  san: "e4",
                },
                comments: [],
                isGameOver: false,
                gameResult: "UNKNOWN",
              },
              children: [
                {
                  position: {
                    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                    lastMove: {
                      player: "b",
                      piece: "p",
                      from: "e7",
                      to: "e5",
                      san: "e5",
                    },
                    comments: [
                      {
                        text: "The standard response",
                      },
                    ],
                    isGameOver: false,
                    gameResult: "UNKNOWN",
                  },
                  children: [
                    {
                      position: {
                        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
                        lastMove: {
                          player: "w",
                          piece: "n",
                          from: "g1",
                          to: "f3",
                          san: "Nf3",
                        },
                        comments: [],
                        isGameOver: false,
                        gameResult: "UNKNOWN",
                      },
                      children: [
                        {
                          position: {
                            fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                            lastMove: {
                              player: "b",
                              piece: "n",
                              from: "b8",
                              to: "c6",
                              san: "Nc6",
                            },
                            comments: [
                              {
                                text: "Defending the pawn",
                              },
                            ],
                            isGameOver: false,
                            gameResult: "UNKNOWN",
                          },
                          children: [
                            {
                              position: {
                                fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
                                lastMove: {
                                  player: "w",
                                  piece: "b",
                                  from: "f1",
                                  to: "b5",
                                  san: "Bb5",
                                },
                                comments: [
                                  {
                                    text: "The Ruy Lopez",
                                  },
                                ],
                                isGameOver: false,
                                gameResult: "UNKNOWN",
                              },
                              children: [],
                            },
                          ],
                        },
                        {
                          position: {
                            fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                            lastMove: {
                              player: "b",
                              piece: "n",
                              from: "g8",
                              to: "f6",
                              san: "Nf6",
                            },
                            comments: [
                              {
                                text: "Going into the Petrov",
                              },
                            ],
                            isGameOver: false,
                            gameResult: "UNKNOWN",
                          },
                          children: [
                            {
                              position: {
                                fen: "rnbqkb1r/pppp1ppp/5n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3",
                                lastMove: {
                                  player: "w",
                                  piece: "n",
                                  from: "f3",
                                  to: "e5",
                                  san: "Nxe5",
                                },
                                comments: [],
                                isGameOver: false,
                                gameResult: "UNKNOWN",
                              },
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]);
  });
});
