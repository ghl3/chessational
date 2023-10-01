import React from "react";
import { MoveDescription, LineResult } from "./MoveDescription";
import CommentArea from "./CommentArea";

interface DescriptionAreaProps {
  result: LineResult;
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
      <MoveDescription result={result} />
      <CommentArea comments={comments} showComments={showComments} />
    </div>
  );
};

export default DescriptionArea;
