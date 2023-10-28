import { Fen } from "@/chess/Fen";
import { useEffect, useState } from "react";

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
      <td className="py-2 px-4 border-b border-gray-600">{san}</td>
      <td className="py-2 px-4 border-b border-gray-600">
        {((totalGamesWithMove / totalGamesInPosition) * 100).toFixed(2)}%
      </td>
      <td className="py-2 px-4 border-b border-gray-600">
        {((white / totalGamesWithMove) * 100).toFixed(2)}%
      </td>
      <td className="py-2 px-4 border-b border-gray-600">
        {((black / totalGamesWithMove) * 100).toFixed(2)}%
      </td>
      <td className="py-2 px-4 border-b border-gray-600">
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

  return (
    <div className="bg-gray-800 p-4 rounded">
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <table className="min-w-full bg-gray-800 border border-gray-600">
          <thead>
            <tr className="text-white">
              <th className="py-2 px-4 border-b border-gray-600">Move</th>
              <th className="py-2 px-4 border-b border-gray-600">%</th>
              <th className="py-2 px-4 border-b border-gray-600">White Wins</th>
              <th className="py-2 px-4 border-b border-gray-600">Black Wins</th>
              <th className="py-2 px-4 border-b border-gray-600">Draws</th>
            </tr>
          </thead>
          <tbody>
            {database.moves.map((move, index) => (
              <MoveRow key={index} move={move} database={database} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
