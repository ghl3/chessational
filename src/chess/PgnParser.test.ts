import { describe } from "node:test";
import { parsePgnString } from "./PgnParser";

describe("PgnParser", () => {
  it("should parse a PGN", () => {
    const pgn = `   1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6
    5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O
    9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 `;
    const tree = parsePgnString(pgn);
    console.log(tree);
  });
});
