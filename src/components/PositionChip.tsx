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
    light: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    dark: "bg-emerald-700 text-emerald-100 hover:bg-emerald-800",
  },
  red: {
    light: "bg-rose-100 text-rose-800 hover:bg-rose-200",
    dark: "bg-rose-700 text-rose-100 hover:bg-rose-800",
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
      size="text-xs"
    />
  );
};

export const makePositionChips = (
  lineAndChapter: LineAndChapter,
  chessboardState: ChessboardState,
  onChipClick?: (lineAndChapter: LineAndChapter) => void,
): React.JSX.Element[] => {
  if (lineAndChapter.line.positions.length === 0) {
    return [];
  }

  return lineAndChapter.line.positions.slice(1).map((position, index) => {
    const onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      chessboardState.setOrientation(lineAndChapter.chapter.orientation);
      chessboardState.clearAndSetPositions(
        lineAndChapter.line.positions,
        index + 1, // Add one because we skipped the first position
      );
      onChipClick?.(lineAndChapter);
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
