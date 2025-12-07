import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { PositionChip } from "./PositionChip";

export interface PositionDescriptionProps {
  currentPosition?: Position;
  positions: Position[];
}

export const PositionDescription: React.FC<PositionDescriptionProps> = ({
  currentPosition,
  positions,
}) => {
  if (currentPosition === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <span className="text-gray-400 text-sm">Moves:</span>
        <div className="flex flex-wrap gap-2 p-3 bg-gray-700 rounded-sm">
          {positions
            .filter((position) => position.lastMove !== null)
            .map((position, index) => (
              <PositionChip
                key={`move-${index}`}
                position={position}
                onClick={() => {}}
                isRemovable={false}
              />
            ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm whitespace-nowrap">FEN:</span>
        <input
          type="text"
          readOnly
          className="flex-1 bg-gray-700 text-gray-100 px-3 py-2 rounded-sm border border-gray-600"
          value={currentPosition?.fen}
        />
      </div>
    </div>
  );
};

export default PositionDescription;
