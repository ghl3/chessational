import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";

export interface PositionDescriptionProps {
  position?: Position;
  gameMoves: Move[];
}

export const PositionDescription: React.FC<PositionDescriptionProps> = ({
  position,
  gameMoves,
}) => {
  if (position === undefined) {
    return null;
  }

  const moveString =
    gameMoves.length > 0 ? gameMoves.map((move) => move.san).join(" ") : "";

  return (
    <div className="flex flex-col space-y-2 p-4">
      <div className="flex items-center">
        <span className="flex items-center text-gray-400 text-sm italic w-12">
          PGN:
        </span>
        <div
          className="ml-2 bg-gray-600 text-white p-1 flex-1 overflow-auto"
          style={{ whiteSpace: "pre-wrap" }} // Ensures text wraps
          contentEditable={false}
        >
          {moveString}
        </div>
      </div>
      <div className="flex items-center">
        <span className="flex items-center text-gray-400 text-sm italic w-12">
          Fen:
        </span>
        <input
          type="text"
          readOnly
          className="ml-2 bg-gray-600 text-white p-1 flex-1"
          value={position?.fen}
        />
      </div>
    </div>
  );
};
