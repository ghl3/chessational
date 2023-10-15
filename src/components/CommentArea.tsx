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

  if (comments.length === 0) {
    return (
      <div>
        <div className="text-lg m-2">No comments for this line.</div>
      </div>
    );
  } else {
    return (
      <div>
        <div className="text-lg m-2">{comments}</div>
      </div>
    );
  }
};

export default CommentArea;
