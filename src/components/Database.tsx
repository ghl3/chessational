import { useEffect, useState } from "react";
import Table from "./Table";
import { Position } from "@/chess/Position";

interface LichessMove {
  uci: string;
  san: string;
  white: number;
  black: number;
  draws: number;
  averageRating: number;
}

interface LichessDatabase {
  white: number;
  black: number;
  draws: number;
  moves: LichessMove[];
}

async function fetchTopMoves(fen: string): Promise<LichessDatabase> {
  const response = await fetch(
    `https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

interface DatabaseProps extends React.HTMLAttributes<HTMLDivElement> {
  showDatabase: boolean;
  position?: Position;
}

export const Database: React.FC<DatabaseProps> = ({
  showDatabase,
  position,
}) => {
  const [database, setDatabase] = useState<LichessDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(showDatabase && position !== null);
    if (position) {
      fetchTopMoves(position.fen)
        .then((data) => {
          setDatabase(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
        });
    }
  }, [position, showDatabase]);

  if (!showDatabase || !position || !database) return null;

  //const totalGames = database.black + database.white + database.draws;
  const totalGames = database.black + database.white + database.draws;
  const whiteWinPercentage = ((database.white / totalGames) * 100).toFixed(1);
  const blackWinPercentage = ((database.black / totalGames) * 100).toFixed(1);
  const drawPercentage = ((database.draws / totalGames) * 100).toFixed(1);

  const headerRow = [
    <>{"Σ"}</>,
    <>{100}</>,
    <>{whiteWinPercentage}</>,
    <>{blackWinPercentage}</>,
    <>{drawPercentage}</>,
  ];

  const rows = database.moves
    .filter((move, index) => {
      const { white, black, draws } = move;
      const totalGamesWithMove = white + black + draws;
      return totalGamesWithMove / totalGames > 0.01;
    })
    .map((move, index) => {
      const { san, white, black, draws } = move;
      const totalGamesWithMove = white + black + draws;

      return [
        <> {san}</>,
        <> {((totalGamesWithMove / totalGames) * 100).toFixed(1)}</>,
        <> {((white / totalGamesWithMove) * 100).toFixed(1)}</>,
        <> {((black / totalGamesWithMove) * 100).toFixed(1)}</>,
        <> {((draws / totalGamesWithMove) * 100).toFixed(1)}</>,
      ];
    });

  return (
    <>
      <Table
        title="Lichess Games Database"
        headers={["Move", "%", "White Wins", "Black Wins", "Draws"]}
        rows={[headerRow, ...rows]}
        loading={loading}
      />
    </>
  );
};
