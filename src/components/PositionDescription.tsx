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
    <div className="flex flex-col space-y-2 p-4">
      <div className="flex flex-col">
        <span className="text-gray-400 text-sm italic mb-2">Moves:</span>
        <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto p-2 bg-gray-600">
          {positions
            .filter((position) => position.lastMove != null)
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
      <div className="flex items-center">
        <span className="flex items-center text-gray-400 text-sm italic w-12">
          Fen:
        </span>
        <input
          type="text"
          readOnly
          className="ml-2 bg-gray-600 text-white p-1 flex-1"
          value={currentPosition?.fen}
        />
      </div>
    </div>
  );
};

export default PositionDescription;
