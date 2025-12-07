import React, { HTMLAttributes } from "react";

interface ChessboardButtonProps extends HTMLAttributes<HTMLDivElement> {
  isDisabled: boolean;
  handleJumpToStart: () => void;
  handleLeftClick: () => void;
  handleRightClick: () => void;
  handleJumpToEnd: () => void;
  handleFlipBoard: () => void;
}

const ChessboardButton: React.FC<{
  label: string | React.ReactNode;
  action: () => void;
  isDisabled: boolean;
  ariaLabel: string;
}> = ({ label, action, isDisabled, ariaLabel }) => (
  <button
    className={`py-2 px-4 text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors ${
      isDisabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    onClick={action}
    disabled={isDisabled}
    aria-label={ariaLabel}
  >
    {label}
  </button>
);

const ChessboardButtons: React.FC<ChessboardButtonProps> = ({
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
    <div className="flex gap-2">
      <ChessboardButton
        label="«"
        action={handleJumpToStart}
        isDisabled={isDisabled}
        ariaLabel="Jump to start"
      />
      <ChessboardButton
        label="←"
        action={handleLeftClick}
        isDisabled={isDisabled}
        ariaLabel="Previous move"
      />
      <ChessboardButton
        label="→"
        action={handleRightClick}
        isDisabled={isDisabled}
        ariaLabel="Next move"
      />
      <ChessboardButton
        label="»"
        action={handleJumpToEnd}
        isDisabled={isDisabled}
        ariaLabel="Jump to end"
      />
      <ChessboardButton
        label="Flip Board"
        action={handleFlipBoard}
        isDisabled={isDisabled}
        ariaLabel="Flip board orientation"
      />
    </div>
  );
};

export default ChessboardButtons;
