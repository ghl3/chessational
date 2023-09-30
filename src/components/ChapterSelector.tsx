import React from "react";

type ChapterProps = {
  chapters?: Chapter[];
  selectedChapter?: string;
  onChapterChange?: (chapter: string) => void;
};

export type Chapter = {
  index: number;
  name: string;
};

export const ChapterSelector: React.FC<ChapterProps> = ({
  chapters,
  selectedChapter,
  onChapterChange,
}) => {
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChapterChange?.(e.target.value);
  };

  return chapters && chapters.length > 0 ? (
    <select value={selectedChapter || ""} onChange={handleChapterChange}>
      <option value="">All Chapters</option>
      {chapters.map((chapter) => (
        <option key={chapter.name} value={chapter.name}>
          {chapter.name}
        </option>
      ))}
    </select>
  ) : null;
};
