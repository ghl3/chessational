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
    <div className="flex justify-center w-full">
      <div className="flex flex-row justify-between items-center max-w-2xl mx-auto">
        <div className="flex-1 px-2">
          <StudyAdderEditor
            studies={studies}
            selectedStudy={studyData.selectedStudy || null}
            selectStudy={studyData.selectStudy}
            deleteStudy={studyData.removeStudy}
            addStudyAndChapters={studyData.addStudyAndChapters}
          />
        </div>

        {studies && studies.length > 0 && (
          <div className="flex-1 px-2">
            <ChapterSelector
              chapters={chapterNames || []}
              selectedChapters={selectedChapterNames || null}
              selectChapter={studyData.addSelectedChapterName}
              deselectChapter={studyData.removeSelectedChapterName}
            />
          </div>
        )}
      </div>
    </div>
  );
};
