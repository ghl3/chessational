import React from "react";

type ControlProps = {
  onNewLine?: () => void;
  onShowSolution?: () => void;
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
}) => {
  return (
    <div style={{ padding: "20px" }}>
      <button
        style={{ padding: "10px 20px", fontSize: "16px", marginRight: "10px" }}
        onClick={onNewLine}
      >
        New Line
      </button>
      <button
        style={{ padding: "10px 20px", fontSize: "16px" }}
        onClick={onShowSolution}
      >
        Show Solution
      </button>
    </div>
  );
};
