import { Color } from "./Color";

export type Fen = string;

export class FenUtil {
  static getTurn = (fen: Fen): Color => {
    return fen.split(" ")[1] as Color;
  };
}
