import { LineStatus, getLineStatus } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Dispatch, SetStateAction, useMemo, useState } from "react";

export interface CurrentLineData {
  lineAndChapter: LineAndChapter | null;
  setLineAndChapter: Dispatch<SetStateAction<LineAndChapter | null>>;
  lineIndex: number;
  setLineIndex: Dispatch<SetStateAction<number>>;
  lineStatus: LineStatus | undefined;
}

export const useCurrentLineData = (): CurrentLineData => {
  // The currently selected line
  const [lineAndChapter, setLineAndChapter] = useState<LineAndChapter | null>(
    null,
  );

  // The current position in the line.
  // The next move to play is line.moves[lineIndex+1]
  const [lineIndex, setLineIndex] = useState<number>(-1);

  const lineStatus = useMemo(() => {
    return lineAndChapter
      ? getLineStatus(lineAndChapter.line, lineIndex)
      : undefined;
  }, [lineAndChapter, lineIndex]);

  return {
    lineAndChapter,
    setLineAndChapter,
    lineIndex,
    setLineIndex,
    lineStatus,
  };
};
