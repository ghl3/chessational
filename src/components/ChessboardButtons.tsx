import React, { HTMLAttributes } from "react";
import { Button } from "./Button";

interface ChessboardButtonsProps extends HTMLAttributes<HTMLDivElement> {
  isDisabled: boolean;
  handleJumpToStart: () => void;
  handleLeftClick: () => void;
  handleRightClick: () => void;
  handleJumpToEnd: () => void;
  handleFlipBoard: () => void;
}

const ChessboardButtons: React.FC<ChessboardButtonsProps> = ({
  isDisabled,
  handleJumpToStart,
  handleLeftClick,
  handleRightClick,
  handleJumpToEnd,
  handleFlipBoard,
}) => {
  if (isDisabled) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <Button
        label="«"
        variant="secondary"
        size="small"
        onClick={handleJumpToStart}
        disabled={isDisabled}
        aria-label="Jump to start"
      />
      <Button
        label="←"
        variant="secondary"
        size="small"
        onClick={handleLeftClick}
        disabled={isDisabled}
        aria-label="Previous move"
      />
      <Button
        label="→"
        variant="secondary"
        size="small"
        onClick={handleRightClick}
        disabled={isDisabled}
        aria-label="Next move"
      />
      <Button
        label="»"
        variant="secondary"
        size="small"
        onClick={handleJumpToEnd}
        disabled={isDisabled}
        aria-label="Jump to end"
      />
      <Button
        label="Flip"
        variant="secondary"
        size="small"
        onClick={handleFlipBoard}
        disabled={isDisabled}
        aria-label="Flip board orientation"
      />
    </div>
  );
};

export default ChessboardButtons;
