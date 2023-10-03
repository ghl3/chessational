import React, { useCallback } from "react";
import { Study, StudyData } from "@/hooks/UseStudyData";
import { StudyAdder } from "./StudyAdder";
import { ChapterSelector } from "./ChapterSelector";
import { StudySelector } from "./StudySelector";

interface StudyChapterSelectorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  studyData: StudyData;
}

export const StudyChapterSelector: React.FC<StudyChapterSelectorProps> = ({
  studyData,
}) => {
  const {
    studies,
    setStudies,
    selectedStudyName,
    setSelectedStudyName,
    selectedChapterNames,
    setSelectedChapterNames,
  } = studyData;

  // Set a default study
  if (studies.length > 0 && selectedStudyName === undefined) {
    setSelectedStudyName(studies[0].name);
  }

  const selectedStudy: Study | undefined = studies.find(
    (study) => study.name === selectedStudyName
  );

  const chapterNames: string[] | undefined = selectedStudy?.chapters.map(
    (chapter) => chapter.name
  );

  const onStudyChange = useCallback(
    (studyName: string) => {
      setSelectedStudyName(studyName);

      // TODO: Clean this up
      const selectedStudy: Study | undefined = studies.find(
        (study) => study.name === studyName
      );
      const chapterNames: string[] | undefined = selectedStudy?.chapters.map(
        (chapter) => chapter.name
      );

      // Default all the chapters to selected
      setSelectedChapterNames(chapterNames || []);
    },
    [selectedStudy]
  );

  return (
    <div className="flex flex-col space-y-4">
      <StudyAdder
        setStudies={setStudies}
        setSelectedStudyName={setSelectedStudyName}
      />

      <StudySelector
        studies={studies}
        selectedStudy={selectedStudyName}
        onStudyChange={onStudyChange}
      />

      <ChapterSelector
        chapters={chapterNames || []}
        selectedChapters={selectedChapterNames}
        setSelectedChapters={setSelectedChapterNames}
      />
    </div>
  );
};
