import React from "react";
import { ControlButton } from "@/components/ControlButton";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  exploreMode: boolean;
  enterExploreMode: () => void;
  enterLineMode: () => void;
  hasActiveLine: boolean;
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
  exploreMode,
  enterExploreMode,
  enterLineMode,
  hasActiveLine,
}) => {
  const exploreModeButtons = <div className="flex space-x-4"></div>;

  const lineModeButtons = (
    <div className="flex space-x-4">
      {/* Buttons for Line Mode */}
      <ControlButton onClick={onNewLine} label="New Line" />
      {hasActiveLine ? (
        <ControlButton onClick={onShowSolution} label="Show Solution" />
      ) : null}
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-center mb-4 space-x-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
        <button
          onClick={enterLineMode}
          className={`inline-block p-4 rounded-t-lg ${
            !exploreMode
              ? "text-white bg-gray-700"
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Review Lines
        </button>
        <button
          onClick={enterExploreMode}
          className={`inline-block p-4 rounded-t-lg ${
            exploreMode
              ? "text-white bg-gray-700 "
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Explore
        </button>
      </div>

      <div className="flex justify-center space-x-4">
        {exploreMode ? exploreModeButtons : lineModeButtons}
      </div>
    </div>
  );
};
