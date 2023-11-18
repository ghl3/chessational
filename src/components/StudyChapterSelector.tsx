import { StudyData } from "@/hooks/UseStudyData";
import React, { useCallback } from "react";
import { ChapterSelector } from "./ChapterSelector";
import { StudyAdder } from "./StudyAdder";
import { StudyRefresher } from "./StudyRefresher";
import { StudySelector } from "./StudySelector";

interface StudyChapterSelectorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  studyData: StudyData;
}

export const StudyChapterSelector: React.FC<StudyChapterSelectorProps> = ({
  studyData,
}) => {
  const { studies, selectedStudyName, selectedChapterNames } = studyData;

  const chapterNames = studyData.chapters
    ? studyData.chapters.map((chapter) => chapter.name)
    : undefined;

  const onStudyChange = useCallback(
    (studyName: string) => {
      studyData.selectStudy(studyName);
    },
    [studyData],
  );

  const onStudyDelete = useCallback(
    (studyName: string) => {
      studyData.removeStudy(studyName);
    },
    [studyData],
  );

  return (
    <div className="flex flex-row space-x-4 items-center">
      {studies && studies.length > 0 ? (
        <StudySelector
          studies={studies}
          selectedStudy={selectedStudyName}
          onStudyChange={onStudyChange}
          onStudyDelete={onStudyDelete}
        />
      ) : null}

      {studies && studies.length > 0 ? (
        <ChapterSelector
          chapters={chapterNames || []}
          selectedChapters={selectedChapterNames || null}
          selectChapter={studyData.addSelectedChapterName}
          deselectChapter={studyData.removeSelectedChapterName}
        />
      ) : null}

      <StudyRefresher
        selectedStudy={studyData.selectedStudy}
        removeStudy={studyData.removeStudy}
        addStudyAndChapters={studyData.addStudyAndChapters}
      />

      <StudyAdder addStudyAndChapters={studyData.addStudyAndChapters} />
    </div>
  );
};
