import React from "react";
import { MoveDescription, MoveDescriptionProps } from "./MoveDescription";
import CommentArea from "./CommentArea";
import { Move } from "@/chess/Move";

interface DescriptionAreaProps {
  move?: Move;
  result: MoveDescriptionProps;
  comments: string[];
  showComments: boolean;
}

const DescriptionArea: React.FC<DescriptionAreaProps> = ({
  move,
  result,
  comments,
  showComments,
}) => {
  return (
    <div>
      <MoveDescription
        move={move}
        status={result.status}
        result={result.result}
      />
      <CommentArea comments={comments} showComments={showComments} />
    </div>
  );
};

export default DescriptionArea;
