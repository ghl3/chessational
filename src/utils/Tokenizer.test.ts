import { Token, tokenizeQuery } from "./Tokenizer";

describe("Chess Move Tokenizer", () => {
  describe("tokenizeQuery", () => {
    it("should correctly tokenize basic pawn moves", () => {
      const result = tokenizeQuery("e4 d5");
      expect(result).toEqual([
        { token: "e4", type: "move" },
        { token: "d5", type: "move" },
      ]);
    });

    it("should correctly tokenize piece moves", () => {
      const result = tokenizeQuery("Nf3 Bc5 Qd4");
      expect(result).toEqual([
        { token: "Nf3", type: "move" },
        { token: "Bc5", type: "move" },
        { token: "Qd4", type: "move" },
      ]);
    });

    it("should handle captures correctly", () => {
      const result = tokenizeQuery("exd5 Nxe5");
      expect(result).toEqual([
        { token: "exd5", type: "move" },
        { token: "Nxe5", type: "move" },
      ]);
    });

    it("should recognize castling moves", () => {
      const result = tokenizeQuery("O-O O-O-O");
      expect(result).toEqual([
        { token: "O-O", type: "move" },
        { token: "O-O-O", type: "move" },
      ]);
    });

    it("should handle check and checkmate symbols", () => {
      const result = tokenizeQuery("Qxf7+ Qxg7#");
      expect(result).toEqual([
        { token: "Qxf7+", type: "move" },
        { token: "Qxg7#", type: "move" },
      ]);
    });

    it("should correctly identify pawn promotions", () => {
      const result = tokenizeQuery("e8=Q d1=N");
      expect(result).toEqual([
        { token: "e8=Q", type: "move" },
        { token: "d1=N", type: "move" },
      ]);
    });

    it("should mark invalid or partial moves as partial", () => {
      const result = tokenizeQuery("e4 Nf Rxh");
      expect(result).toEqual([
        { token: "e4", type: "move" },
        { token: "Nf", type: "partial" },
        { token: "Rxh", type: "partial" },
      ]);
    });

    it("should handle a mix of valid moves and partial tokens", () => {
      const result = tokenizeQuery("e4 e5 Nf3 Nc6 Bb");
      expect(result).toEqual([
        { token: "e4", type: "move" },
        { token: "e5", type: "move" },
        { token: "Nf3", type: "move" },
        { token: "Nc6", type: "move" },
        { token: "Bb", type: "partial" },
      ]);
    });

    it("should correctly handle moves with disambiguation", () => {
      const result = tokenizeQuery("Nbd7 R1e1 Qh4e1");
      expect(result).toEqual([
        { token: "Nbd7", type: "move" },
        { token: "R1e1", type: "move" },
        { token: "Qh4e1", type: "move" },
      ]);
    });

    it("should ignore empty spaces and return an empty array for empty input", () => {
      expect(tokenizeQuery("")).toEqual([]);
      expect(tokenizeQuery("   ")).toEqual([]);
    });

    it("should handle a long sequence of moves correctly", () => {
      const result = tokenizeQuery(
        "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O",
      );
      expect(result).toHaveLength(14);
    });
  });
});
