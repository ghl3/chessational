import React from "react";

interface ChapterProps extends React.HTMLAttributes<HTMLDivElement> {
  chapters?: Chapter[];
  selectedChapter?: string;
  onChapterChange?: (chapter: string) => void;
}

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

  return (
    <select
      className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
      value={selectedChapter || ""}
      onChange={handleChapterChange}
    >
      <option value="">All Chapters</option>
      {(chapters || []).map((chapter) => (
        <option key={chapter.name} value={chapter.name}>
          {chapter.name}
        </option>
      ))}
    </select>
  );
};
