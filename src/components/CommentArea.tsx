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
    <div className="text-gray-400">
      {comments.length === 0 ? (
        <div className="italic text-sm">No comments for this line.</div>
      ) : (
        <div className="text-lg">{comments.join(" ")}</div>
      )}
    </div>
  );
};

export default CommentArea;
