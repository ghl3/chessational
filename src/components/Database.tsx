import { db } from "@/app/db";
import { LichessDatabase } from "@/chess/DatabasePosition";
import { Position } from "@/chess/Position";
import { getOrFetchAndCacheDatabase } from "@/utils/PositionFetcher";
import { useEffect, useState } from "react";
import Table from "./Table";

interface DatabaseProps extends React.HTMLAttributes<HTMLDivElement> {
  //showDatabase: boolean;
  position: Position;
}

export const Database: React.FC<DatabaseProps> = ({
  //showDatabase,
  position,
}) => {
  const [database, setDatabase] = useState<LichessDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(position !== null);
    if (position) {
      getOrFetchAndCacheDatabase(position.fen, db.positions)
        .then((data) => {
          setDatabase(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch database for position:", error);
          setLoading(false);
        });
    }
  }, [position]);

  if (!database) return null;

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
