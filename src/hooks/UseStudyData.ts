import { PgnTree } from "@/chess/PgnTree";
import { useState } from "react";

export type Chapter = {
  index: number;
  name: string;
  tree: PgnTree;
};

export interface Study {
  name: string;
  url: string;
  chapters: Chapter[];
}

// A Chessboard can be thought of as a series of moves and
// positions as well as an orientation and board size.
export interface StudyData {
  studies: Study[];
  selectedStudyName?: string;
  // If null, all chapters are selected
  selectedChapterNames: string[];

  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
  setSelectedStudyName: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  setSelectedChapterNames: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useStudyData = (): StudyData => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudyName, setSelectedStudyName] = useState<string>();
  const [selectedChapterNames, setSelectedChapterNames] = useState<string[]>(
    []
  );

  return {
    studies,
    selectedStudyName,
    selectedChapterNames,
    setStudies,
    setSelectedStudyName,
    setSelectedChapterNames,
  };
};
