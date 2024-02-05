import { StudyData } from "@/hooks/UseStudyData";
import React from "react";
import { ChapterSelector } from "./ChapterSelector";
import { StudyAdderEditor } from "./StudyAdderEditor";

interface StudyChapterSelectorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  studyData: StudyData;
}

export const StudyChapterSelector: React.FC<StudyChapterSelectorProps> = ({
  studyData,
}) => {
  const { studies, selectedChapterNames } = studyData;

  const chapterNames = studyData.chapters
    ? studyData.chapters.map((chapter) => chapter.name)
    : undefined;

  return (
    <div className="flex flex-row space-x-4 items-center">
      <StudyAdderEditor
        studies={studies}
        selectedStudy={studyData.selectedStudy || null}
        selectStudy={studyData.selectStudy}
        deleteStudy={studyData.removeStudy}
        addStudyAndChapters={studyData.addStudyAndChapters}
      />

      {studies && studies.length > 0 ? (
        <ChapterSelector
          chapters={chapterNames || []}
          selectedChapters={selectedChapterNames || null}
          selectChapter={studyData.addSelectedChapterName}
          deselectChapter={studyData.removeSelectedChapterName}
        />
      ) : null}
    </div>
  );
};
