import { Chapter } from "@/chess/Chapter";
import { Move } from "@/chess/Move";
import { Position } from "@/chess/Position";
import { PositionNode } from "@/chess/PositionTree";
import React from "react";

interface ChapterInfoProps {
  chapter: Chapter;
  position?: Position;
}

const findPosition = (
  positionNode: PositionNode,
  position: Position,
  moves: Move[],
): Move[] | null => {
  if (positionNode.position.fen === position.fen) {
    return moves;
  } else {
    for (let child of positionNode.children) {
      if (child.position.lastMove === null) {
        throw new Error("Position node has no last move");
      }
      const newMoves: Move[] = [...moves, child.position.lastMove];
      const result = findPosition(child, position, newMoves);
      if (result) {
        return result;
      }
    }
    return null;
  }
};

const getLastMainLineMoveIndex = (
  chapter: Chapter,
  position: Position,
): number | null => {
  const moves = findPosition(chapter.positionTree, position, []);
  if (!moves) {
    return null;
  }

  var currentPosition: PositionNode = chapter.positionTree;
  var moveIndex = 0;

  for (const move of moves) {
    if (currentPosition.children.length === 0) {
      return moveIndex;
    } else if (currentPosition.children[0].position.lastMove === move) {
      currentPosition = currentPosition.children[0];
      moveIndex++;
    } else {
      return moveIndex;
    }
  }
  return moveIndex;
};

const ChapterInfo: React.FC<ChapterInfoProps> = ({ chapter, position }) => {
  const chapterUrl = chapter.headers["Site"];

  // Lichess lets you link to a specific part of a chater, but only
  // if it's in the main line.  To do so, you reference it by the
  // index of the move in the main line.
  // If the current position isn't a part of the main line, we link
  // the last move in the main line that led to this position.
  const lastMainLineMoveIndex =
    position !== null && position !== undefined ? getLastMainLineMoveIndex(chapter, position) : null;
  const fullUrl = chapterUrl + "#" + lastMainLineMoveIndex;

  return (
    <div className="p-4 rounded-md ">
      {fullUrl ? (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          {chapter.name}
        </a>
      ) : (
        <span className="text-gray-300">{chapter.name}</span>
      )}
    </div>
  );
};

export default ChapterInfo;
