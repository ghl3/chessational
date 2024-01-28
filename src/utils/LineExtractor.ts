import { Chapter } from "@/chess/Chapter";
import { Fen } from "@/chess/Fen";
import { Line, createLineId } from "@/chess/Line";
import { Position } from "@/chess/Position";
import { PositionNode as Node } from "@/chess/PositionTree";
import { ChapterAndLines } from "@/chess/StudyChapterAndLines";

const getTranspositions = (
  node: Node,
  positionIndex: Map<Fen, Node[]>,
): Node[] => {
  const fen: Fen = node.position.fen;

  const transpositions = positionIndex.get(fen);

  if (transpositions === undefined) {
    return [];
  } else {
    return transpositions.filter((n) => n !== node);
  }
};

const createPositionIndex = (chapters: Chapter[]): Map<Fen, Node[]> => {
  const positionIndex = new Map<Fen, Node[]>();

  const addNodeAndChildrenToIndex = (node: Node) => {
    const fen: Fen = node.position.fen;

    const existingNodes = positionIndex.get(fen);
    if (existingNodes) {
      existingNodes.push(node);
    } else {
      positionIndex.set(fen, [node]);
    }

    node.children.forEach(addNodeAndChildrenToIndex);
  };

  for (const chapter of chapters) {
    addNodeAndChildrenToIndex(chapter.positionTree);
  }

  return positionIndex;
};

const getAllMoveLists = (
  node: Node,
  currentLine: Position[],
  isPlayerMove: boolean,
  positionIndex: Map<Fen, Node[]>,
): Position[][] => {
  if (node.children.length === 0) {
    // If there are transpositions with children, iterate through them
    const transpositions = getTranspositions(node, positionIndex).filter(
      (t) => t.children.length > 0,
    );

    if (transpositions.length > 0) {
      return transpositions.flatMap((transposition) => {
        return getAllMoveLists(
          transposition,
          currentLine,
          !isPlayerMove,
          positionIndex,
        );
      });
    } else {
      // Otherwise, terminate the line
      return [currentLine];
    }
  } else if (isPlayerMove) {
    // If there are multiple moves for the player,
    // for now, just pick the first one
    const child = node.children[0];
    const nextLine: Position[] = [...currentLine, child.position];
    return getAllMoveLists(child, nextLine, !isPlayerMove, positionIndex);
  } else {
    return node.children.flatMap((child) => {
      const nextLine: Position[] = [...currentLine, child.position];
      return getAllMoveLists(child, nextLine, !isPlayerMove, positionIndex);
    });
  }
};

const getLinesFromChapter = (
  studyName: string,
  chapter: Chapter,
  positionIndex: Map<Fen, Node[]>,
): Line[] => {
  const orientation = chapter.orientation;
  var node: Node = chapter.positionTree;
  const playerHasFirstMove = orientation === "w";

  const positionLists: Position[][] = getAllMoveLists(
    node,
    [node.position],
    playerHasFirstMove,
    positionIndex,
  );

  const allLines = [];
  for (let positions of positionLists) {
    allLines.push({
      studyName,
      chapterName: chapter.name,
      lineId: createLineId(positions),
      positions,
      orientation: orientation,
    });
  }

  const filteredLines = allLines.filter((line) => {
    return line.positions.length > 0;
  });

  // TODO: Filter lines that have multiple player moves
  // Ensure all lines end with the player's move (dropping the last move if needed)
  const lines = filteredLines.map((line) => {
    const lastPosition = line.positions[line.positions.length - 1];
    const lastMove = lastPosition.lastMove;

    if (lastMove && lastMove.player === orientation) {
      return line;
    } else {
      return {
        ...line,
        positions: line.positions.slice(0, line.positions.length - 1),
      };
    }
  });

  return lines;
};

export const getLinesFromChapters = (
  studyName: string,
  chapters: Chapter[],
): ChapterAndLines[] => {
  const positionIndex = createPositionIndex(chapters);

  return chapters.map((chapter) => {
    const lines = getLinesFromChapter(studyName, chapter, positionIndex);
    return { chapter, lines };
  });
};
