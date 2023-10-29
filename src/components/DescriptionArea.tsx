import React from "react";
import { MoveDescription, MoveResult } from "./MoveDescription";
import CommentArea from "./CommentArea";
import { Move } from "@/chess/Move";
import { LineStatus } from "@/chess/Line";

interface DescriptionAreaProps {
  move?: Move;
  moveResult?: MoveResult;
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
    <div>
      <MoveDescription move={move} status={lineStatus} result={moveResult} />
      <CommentArea comments={comments} showComments={showComments} />
    </div>
  );
};

export default DescriptionArea;
