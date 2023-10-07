import { getPieceCounts } from "./Fen";

describe("Chess FEN Parsing", () => {
  it("should correctly parse FEN for initial position", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const result = getPieceCounts(fen);
    expect(result).toEqual({
      white: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
      black: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
    });
  });

  it("should correctly parse FEN for another position", () => {
    const fen = "8/8/8/8/2P2P2/8/8/8 w - - 0 1";
    const result = getPieceCounts(fen);
    expect(result).toEqual({
      white: { p: 2, r: 0, n: 0, b: 0, q: 0, k: 0 },
      black: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    });
  });
});
