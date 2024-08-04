import { LineStatus } from "@/chess/Line";
import { ControlButton } from "@/components/ControlButton";
import React from "react";

type ControlProps = {
  lineStatus?: LineStatus;
  toggleShowSolution: () => void;
  onNewLine: () => void;
  onRestartLine: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  lineStatus,
  onNewLine,
  onRestartLine,
  toggleShowSolution,
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
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-center space-x-4">{lineModeButtons}</div>
    </div>
  );
};
