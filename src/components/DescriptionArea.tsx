import React from "react";
import { MoveDescription, LineState } from "./MoveDescription";
import CommentArea from "./CommentArea";

interface DescriptionAreaProps {
  result: LineState;
  comments: string[];
  showComments: boolean;
}

const DescriptionArea: React.FC<DescriptionAreaProps> = ({
  result,
  comments,
  showComments,
}) => {
  return (
    <div>
      <MoveDescription status={result.status} result={result.result} />
      <CommentArea comments={comments} showComments={showComments} />
    </div>
  );
};

export default DescriptionArea;
