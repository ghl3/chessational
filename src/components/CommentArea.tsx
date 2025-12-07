import React from "react";

interface CommentAreaProps {
  comments: string[];
}

const CommentArea: React.FC<CommentAreaProps> = ({ comments }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No comments for this line.</p>
      ) : (
        <p className="text-gray-100 leading-relaxed">{comments.join(" ")}</p>
      )}
    </div>
  );
};

export default CommentArea;
