export interface LichessMove {
  uci: string;
  san: string;
  white: number;
  black: number;
  draws: number;
  averageRating: number;
}

export interface LichessDatabase {
  white: number;
  black: number;
  draws: number;
  moves: LichessMove[];
}
