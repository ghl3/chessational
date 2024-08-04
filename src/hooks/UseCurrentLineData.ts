import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Dispatch, SetStateAction, useState } from "react";

export interface CurrentLineData {
  lineAndChapter: LineAndChapter | null;
  setLineAndChapter: Dispatch<SetStateAction<LineAndChapter | null>>;
  lineIndex: number;
  setLineIndex: Dispatch<SetStateAction<number>>;
}

export const useCurrentLineData = (): CurrentLineData => {
  // The currently selected line
  const [lineAndChapter, setLineAndChapter] = useState<LineAndChapter | null>(
    null,
  );

  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  const [lineIndex, setLineIndex] = useState<number>(-1);

  return {
    lineAndChapter,
    setLineAndChapter,
    lineIndex,
    setLineIndex,
  };
};
