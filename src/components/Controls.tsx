import React from "react";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  onShowComments: () => void;
  exploreMode: boolean;
  toggleExploreMode: () => void;
  engineIsEnabled: boolean;
  toggleEngine: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
  onShowComments,
  exploreMode,
  toggleExploreMode,
  engineIsEnabled,
  toggleEngine,
}) => {
  return (
    <div className="p-5">
      <div className="flex space-x-4 mb-2">
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
          className="px-4 py-2 text-lg bg-blue-500 text-white rounded"
          onClick={toggleExploreMode}
        >
          {exploreMode ? "Return to Line" : "Explore Mode"}
        </button>
      </div>
      <div className="flex space-x-4">
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
          onClick={toggleEngine}
        >
          {engineIsEnabled ? "Hide Engine" : "Show Engine"}
        </button>
      </div>
    </div>
  );
};
