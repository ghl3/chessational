import { Position } from "@/chess/Position";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
import { WHITE } from "chess.js";
import Chip from "./Chip";

type ChipColor = "blue" | "green" | "red";
type ChipVariant = "light" | "dark";

const colorClasses: Record<ChipColor, Record<ChipVariant, string>> = {
  blue: {
    light: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    dark: "bg-blue-700 text-blue-100 hover:bg-blue-800",
  },
  green: {
    light: "bg-green-100 text-green-800 hover:bg-green-200",
    dark: "bg-green-700 text-green-100 hover:bg-green-800",
  },
  red: {
    light: "bg-red-100 text-red-800 hover:bg-red-200",
    dark: "bg-red-700 text-red-100 hover:bg-red-800",
  },
};

const removeButtonClasses = {
  light:
    "text-blue-400 hover:bg-blue-300 hover:text-blue-600 focus:bg-blue-500 focus:text-white",
  dark: "text-blue-200 hover:bg-blue-600 hover:text-blue-100 focus:bg-blue-400 focus:text-white",
};

export const PositionChip: React.FC<{
  position: Position;
  onClick: (e: React.MouseEvent) => void;
  isRemovable: boolean;
}> = ({ position, onClick, isRemovable = false }) => {
  const baseColor = "blue";
  const variant = position.lastMove
    ? position.lastMove?.player === WHITE
      ? "light"
      : "dark"
    : "light";

  const color = colorClasses[baseColor][variant];

  const removeColor = removeButtonClasses[variant];

  return (
    <Chip
      label={position.lastMove?.san || ""}
      onClick={onClick}
      style={color}
      isRemovable={isRemovable}
      removeButtonStyle={removeColor}
    />
  );
};

export const makePositionChips = (
  lineAndChapter: LineAndChapter,
  chessboardState: ChessboardState,
): React.JSX.Element[] => {
  if (lineAndChapter.line.positions.length === 0) {
    return [];
  }

  return lineAndChapter.line.positions.slice(1).map((position, index) => {
    const onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      chessboardState.clearAndSetPositions(
        lineAndChapter.line.positions,
        index + 1, // Add one because we skipped the first position
      );
    };
    const key = `${lineAndChapter.line.lineId}-${index}`;
    return (
      <PositionChip
        position={position}
        onClick={onClick}
        isRemovable={false}
        key={key}
      />
    );
  });
};

export default PositionChip;
