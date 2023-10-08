import React from "react";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  onShowComments: () => void;
  exploreMode: boolean;
  toggleExploreMode: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
  onShowComments,
  exploreMode,
  toggleExploreMode,
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
        className={`px-4 py-2 text-lg ${
          exploreMode
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white"
        } rounded`}
        onClick={!exploreMode ? onShowSolution : undefined}
        disabled={exploreMode}
      >
        Show Solution
      </button>

      <button
        className={`px-4 py-2 text-lg ${
          exploreMode
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white"
        } rounded`}
        onClick={!exploreMode ? onShowComments : undefined}
        disabled={exploreMode}
      >
        Show Comments
      </button>

      <button
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded"
        onClick={toggleExploreMode}
      >
        {exploreMode ? "Return to Line" : "Explore Mode"}
      </button>
    </div>
  );
};
