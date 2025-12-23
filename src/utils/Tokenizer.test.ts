import { Token, tokenizeQuery } from "./Tokenizer";

describe("tokenizeQuery", () => {
  it("tokenizes basic pawn moves", () => {
    expect(tokenizeQuery("e4 d5")).toEqual([
      { token: "e4", type: "move" },
      { token: "d5", type: "move" },
    ]);
  });

  it("tokenizes piece moves", () => {
    expect(tokenizeQuery("Nf3 Bc5 Qd4")).toEqual([
      { token: "Nf3", type: "move" },
      { token: "Bc5", type: "move" },
      { token: "Qd4", type: "move" },
    ]);
  });

  it("handles captures", () => {
    expect(tokenizeQuery("exd5 Nxe5")).toEqual([
      { token: "exd5", type: "move" },
      { token: "Nxe5", type: "move" },
    ]);
  });

  it("recognizes castling moves", () => {
    expect(tokenizeQuery("O-O O-O-O")).toEqual([
      { token: "O-O", type: "move" },
      { token: "O-O-O", type: "move" },
    ]);
  });

  it("handles check and checkmate symbols", () => {
    expect(tokenizeQuery("Qxf7+ Qxg7#")).toEqual([
      { token: "Qxf7+", type: "move" },
      { token: "Qxg7#", type: "move" },
    ]);
  });

  it("identifies pawn promotions", () => {
    expect(tokenizeQuery("e8=Q d1=N")).toEqual([
      { token: "e8=Q", type: "move" },
      { token: "d1=N", type: "move" },
    ]);
  });

  it("marks invalid or partial moves as partial", () => {
    expect(tokenizeQuery("e4 Nf Rxh")).toEqual([
      { token: "e4", type: "move" },
      { token: "Nf", type: "partial" },
      { token: "Rxh", type: "partial" },
    ]);
  });

  it("handles a mix of valid moves and partial tokens", () => {
    expect(tokenizeQuery("e4 e5 Nf3 Nc6 Bb")).toEqual([
      { token: "e4", type: "move" },
      { token: "e5", type: "move" },
      { token: "Nf3", type: "move" },
      { token: "Nc6", type: "move" },
      { token: "Bb", type: "partial" },
    ]);
  });

  it("handles moves with disambiguation", () => {
    expect(tokenizeQuery("Nbd7 R1e1 Qh4e1")).toEqual([
      { token: "Nbd7", type: "move" },
      { token: "R1e1", type: "move" },
      { token: "Qh4e1", type: "move" },
    ]);
  });

  it("returns empty array for empty or whitespace input", () => {
    expect(tokenizeQuery("")).toEqual([]);
    expect(tokenizeQuery("   ")).toEqual([]);
  });

  it("handles a long sequence of moves", () => {
    expect(
      tokenizeQuery("e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O"),
    ).toHaveLength(14);
  });
});
