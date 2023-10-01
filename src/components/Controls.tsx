import React from "react";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  onShowComments: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
  onShowComments,
}) => {
  return (
    <div className="space-x-4 p-5">
      <button
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded"
        onClick={onNewLine}
      >
        New Line
      </button>

      <button
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded"
        onClick={onShowSolution}
      >
        Show Solution
      </button>

      <button
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded"
        onClick={onShowComments}
      >
        Show Comments
      </button>
    </div>
  );
};
