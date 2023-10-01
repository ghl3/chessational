import React from "react";

export type LineResult = "Correct" | "Incorrect" | "Line Complete" | "Unknown";

interface MoveDescriptionProps {
  result: LineResult;
}

export const MoveDescription: React.FC<MoveDescriptionProps> = ({ result }) => {
  let color = "";
  let text = "";

  switch (result) {
    case "Incorrect":
      color = "text-red-400";
      text = "That move is not part of the line";
      break;
    case "Line Complete":
      color = "text-blue-400";
      text = "This is the end of the line";
      break;
    default:
      color = "text-gray-400";
  }

  return <div className={`${color} text-lg m-2`}>{text}</div>;
};
