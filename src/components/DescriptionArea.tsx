import React from "react";
import { MoveDescription, LineMoveResult } from "./MoveDescription";
import CommentArea from "./CommentArea";
import { Move } from "@/chess/Move";
import { LineStatus } from "@/chess/Line";

interface DescriptionAreaProps {
  move?: Move;
  moveResult?: LineMoveResult;
  lineStatus?: LineStatus;
  //result: LineState;
  comments: string[];
  showComments: boolean;
}

const DescriptionArea: React.FC<DescriptionAreaProps> = ({
  move,
  moveResult,
  lineStatus,
  comments,
  showComments,
}) => {
  return (
    <div className="bg-gray-800 p-4 overflow-hidden whitespace-normal">
      <div>
        <MoveDescription move={move} status={lineStatus} result={moveResult} />
        <CommentArea comments={comments} showComments={showComments} />
      </div>
    </div>
  );
};

export default DescriptionArea;
