import { LineStatus } from "@/chess/Line";
import { ControlButton } from "@/components/ControlButton";
import React from "react";

type ControlProps = {
  mode: "LINE" | "EXPLORE";
  lineStatus?: LineStatus;
  toggleShowSolution: () => void;
  onNewLine: () => void;
  onRestartLine: () => void;
  enterExploreMode: () => void;
  enterLineMode: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  mode,
  lineStatus,
  onNewLine,
  onRestartLine,
  toggleShowSolution,
  enterExploreMode,
  enterLineMode,
}) => {
  const hasActiveLine = lineStatus != undefined;

  const lineIsComplete = lineStatus === "LINE_COMPLETE";

  const lineModeButtons = (
    <div className="flex space-x-4">
      {/* Buttons for Line Mode */}
      <ControlButton onClick={onNewLine} label="New Line" size={"large"} />

      {hasActiveLine ? (
        <ControlButton
          onClick={onRestartLine}
          label="Restart Line"
          size={"large"}
        />
      ) : null}

      {hasActiveLine ? (
        <ControlButton
          onClick={toggleShowSolution}
          label="Show Solution"
          size={"large"}
          disabled={lineIsComplete}
        />
      ) : null}

      <ControlButton
        onClick={mode === "LINE" ? enterExploreMode : enterLineMode}
        label={mode === "LINE" ? "Enter Explore Mode" : "Return to Line"}
        size={"large"}
      />
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-center space-x-4">{lineModeButtons}</div>
    </div>
  );
};
