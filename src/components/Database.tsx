import { Fen } from "@/chess/Fen";
import { useEffect, useState } from "react";
import Table from "./Table";

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

interface MoveRowProps extends React.HTMLAttributes<HTMLDivElement> {
  key: number;
  move: LichessMove;
  database: LichessDatabase;
}

const MoveRow: React.FC<MoveRowProps> = ({ move, database }) => {
  const { san, white, black, draws } = move;
  const totalGamesInPosition = database.black + database.white + database.draws;
  const totalGamesWithMove = white + black + draws;
  return (
    <tr className="text-white">
      <td className="py-1 px-2 border-b border-gray-600">{san}</td>
      <td className="py-1 px-2 border-b border-gray-600">
        {((totalGamesWithMove / totalGamesInPosition) * 100).toFixed(2)}%
      </td>
      <td className="py-1 px-2 border-b border-gray-600">
        {((white / totalGamesWithMove) * 100).toFixed(2)}%
      </td>
      <td className="py-1 px-2 border-b border-gray-600">
        {((black / totalGamesWithMove) * 100).toFixed(2)}%
      </td>
      <td className="py-1 px-2 border-b border-gray-600">
        {((draws / totalGamesWithMove) * 100).toFixed(2)}%
      </td>
    </tr>
  );
};

interface DatabaseProps extends React.HTMLAttributes<HTMLDivElement> {
  showDatabase: boolean;
  position: Fen;
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
      fetchTopMoves(position)
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

  const rows = database.moves.map((move, index) => {
    const { san, white, black, draws } = move;
    const totalGamesInPosition =
      database.black + database.white + database.draws;
    const totalGamesWithMove = white + black + draws;

    return [
      <> {san}</>,
      <> {((totalGamesWithMove / totalGamesInPosition) * 100).toFixed(2)}</>,
      <> {((white / totalGamesWithMove) * 100).toFixed(2)}</>,
      <> {((black / totalGamesWithMove) * 100).toFixed(2)}</>,
      <> {((draws / totalGamesWithMove) * 100).toFixed(2)}</>,
    ];
  });

  return (
    <Table
      title="Lichess Games Database"
      headers={["Move", "%", "White Wins", "Black Wins", "Draws"]}
      rows={rows}
      loading={loading}
    />
  );
};
