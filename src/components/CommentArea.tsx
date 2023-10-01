import React from "react";

interface CommentAreaProps {
  comments: string[];
  showComments: boolean;
}

const CommentArea: React.FC<CommentAreaProps> = ({
  comments,
  showComments,
}) => {
  if (!showComments) {
    return null;
  }
  return (
    <div>
      <div className="text-lg m-2">{comments}</div>
    </div>
  );
};

export default CommentArea;
