import React from "react";
import { ControlButton } from "@/components/ControlButton";
import { LineStatus } from "@/chess/Line";

type ControlProps = {
  mode: "LINE" | "EXPLORE";
  lineStatus?: LineStatus;
  onShowSolution: () => void;
  onNewLine: () => void;
  enterExploreMode: () => void;
  enterLineMode: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  mode,
  lineStatus,
  onNewLine,
  onShowSolution,
  enterExploreMode,
  enterLineMode,
}) => {
  const exploreModeButtons = <div className="flex space-x-4"></div>;

  const hasActiveLine = lineStatus != undefined;

  const lineIsComplete = lineStatus === "LINE_COMPLETE";

  const lineModeButtons = (
    <div className="flex space-x-4">
      {/* Buttons for Line Mode */}
      <ControlButton onClick={onNewLine} label="New Line" size={"large"} />
      {hasActiveLine ? (
        <ControlButton
          onClick={onShowSolution}
          label="Show Solution"
          size={"large"}
          disabled={lineIsComplete}
        />
      ) : null}
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-center mb-4 space-x-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
        <button
          onClick={enterLineMode}
          className={`inline-block p-4 rounded-t-lg ${
            mode === "LINE"
              ? "text-white bg-gray-700"
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Review Lines
        </button>
        <button
          onClick={enterExploreMode}
          className={`inline-block p-4 rounded-t-lg ${
            mode === "EXPLORE"
              ? "text-white bg-gray-700 "
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Explore
        </button>
      </div>

      <div className="flex justify-center space-x-4">
        {mode == "EXPLORE" ? exploreModeButtons : lineModeButtons}
      </div>
    </div>
  );
};
