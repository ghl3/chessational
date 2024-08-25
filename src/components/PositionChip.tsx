import { Position } from "@/chess/Position";
import Chip from "./Chip";

const PositionChip: React.FC<{
  position: Position;
  onClick: (e: React.MouseEvent) => void;
}> = ({ position, onClick }) => {
  return <Chip label={position.lastMove?.san || ""} onClick={onClick} />;
};

export default PositionChip;
