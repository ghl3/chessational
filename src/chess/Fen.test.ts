import { getPieceCounts } from "./Fen";

describe("getPieceCounts", () => {
  it("parses FEN for initial position", () => {
    expect(
      getPieceCounts("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    ).toEqual({
      white: new Map(Object.entries({ p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 })),
      black: new Map(Object.entries({ p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 })),
    });
  });

  it("parses FEN with only white pawns", () => {
    expect(getPieceCounts("8/8/8/8/2P2P2/8/8/8 w - - 0 1")).toEqual({
      white: new Map(Object.entries({ p: 2, r: 0, n: 0, b: 0, q: 0, k: 0 })),
      black: new Map(Object.entries({ p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 })),
    });
  });
});
