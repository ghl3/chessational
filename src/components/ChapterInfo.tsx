import { Chapter } from "@/chess/Chapter";
import React from "react";

interface ChapterInfoProps {
  chapter?: Chapter;
  showChapter: boolean;
}

const ChapterInfo: React.FC<ChapterInfoProps> = ({ chapter, showChapter }) => {
  if (!showChapter || !chapter) {
    return null;
  }

  return <div>{chapter.name}</div>;
};

export default ChapterInfo;
