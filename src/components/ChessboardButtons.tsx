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
  label: string;
  action: () => void;
  isDisabled: boolean;
}> = ({ label, action, isDisabled }) => (
  <button
    className={`py-2 px-4 text-white bg-gray-700 hover:bg-gray-600 ${
      isDisabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    onClick={action}
    disabled={isDisabled}
    dangerouslySetInnerHTML={{ __html: label }}
  />
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
    <div className="flex space-x-4">
      <ChessboardButton
        label="&laquo;"
        action={handleJumpToStart}
        isDisabled={isDisabled}
      />
      <ChessboardButton
        label="&larr;"
        action={handleLeftClick}
        isDisabled={isDisabled}
      />
      <ChessboardButton
        label="&rarr;"
        action={handleRightClick}
        isDisabled={isDisabled}
      />
      <ChessboardButton
        label="&raquo;"
        action={handleJumpToEnd}
        isDisabled={isDisabled}
      />
      <ChessboardButton
        label="Flip Board"
        action={handleFlipBoard}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default ChessboardButtons;
