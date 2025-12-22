import { db } from "@/app/db";
import { LichessDatabase } from "@/chess/DatabasePosition";
import { Position } from "@/chess/Position";
import { getOrFetchAndCacheDatabase } from "@/utils/PositionFetcher";
import { useQuery } from "@tanstack/react-query";
import Table from "./Table";

interface DatabaseProps extends React.HTMLAttributes<HTMLDivElement> {
  position: Position;
}

export const Database: React.FC<DatabaseProps> = ({ position }) => {
  const {
    data: database,
    isLoading,
    error,
  } = useQuery<LichessDatabase | null>({
    queryKey: ["lichess-db", position?.fen],
    queryFn: () => getOrFetchAndCacheDatabase(position.fen, db.positions),
    enabled: !!position,
  });

  if (error) {
    console.error("Failed to fetch database for position:", error);
  }

  if (!database) return null;

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
    .filter((move) => {
      const { white, black, draws } = move;
      const totalGamesWithMove = white + black + draws;
      return totalGamesWithMove / totalGames > 0.01;
    })
    .map((move) => {
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
        loading={isLoading}
      />
    </>
  );
};
