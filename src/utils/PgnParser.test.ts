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
    const tree = parsePgnStringToChapters(pgn);
    expect(tree).toEqual([
      {
        headers: { Foo: "Bar" },
        name: "",
        orientation: "w",
        studyName: "",
        moveTree: {
          children: [
            {
              move: "e4",
              fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
              from: "e2",
              isGameOver: false,
              piece: "p",
              player: "w",
              to: "e4",
              children: [
                {
                  move: "e5",
                  fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                  from: "e7",
                  isGameOver: false,
                  piece: "p",
                  player: "b",
                  to: "e5",
                  children: [
                    {
                      move: "Nf3",
                      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
                      from: "g1",
                      isGameOver: false,
                      piece: "n",
                      player: "w",
                      to: "f3",
                      children: [
                        {
                          move: "Nc6",
                          fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                          from: "b8",
                          isGameOver: false,
                          piece: "n",
                          player: "b",
                          to: "c6",
                          children: [],
                        },
                        {
                          move: "Nf6",
                          fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                          from: "g8",
                          isGameOver: false,
                          piece: "n",
                          player: "b",
                          to: "f6",
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
        headers: { Foo: "Bar" },
        name: "",
        orientation: "w",
        studyName: "",
        moveTree: {
          children: [
            {
              move: "e4",
              fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
              from: "e2",
              isGameOver: false,
              piece: "p",
              player: "w",
              to: "e4",
              children: [
                {
                  move: "e5",
                  fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                  from: "e7",
                  isGameOver: false,
                  piece: "p",
                  player: "b",
                  to: "e5",
                  comments: ["The standard response"],
                  children: [
                    {
                      move: "Nf3",
                      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
                      from: "g1",
                      isGameOver: false,
                      piece: "n",
                      player: "w",
                      to: "f3",
                      children: [
                        {
                          move: "Nc6",
                          fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                          from: "b8",
                          isGameOver: false,
                          piece: "n",
                          player: "b",
                          to: "c6",
                          comments: ["Defending the pawn"],
                          children: [
                            {
                              move: "Bb5",
                              fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
                              from: "f1",
                              isGameOver: false,
                              piece: "b",
                              player: "w",
                              to: "b5",
                              comments: ["The Ruy Lopez"],
                              children: [],
                            },
                          ],
                        },
                        {
                          move: "Nf6",
                          fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
                          from: "g8",
                          isGameOver: false,
                          piece: "n",
                          player: "b",
                          to: "f6",
                          comments: ["Going into the Petrov"],
                          children: [
                            {
                              move: "Nxe5",
                              fen: "rnbqkb1r/pppp1ppp/5n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3",
                              from: "f3",
                              isGameOver: false,
                              piece: "n",
                              player: "w",
                              to: "e5",
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
