import { Study } from "@/chess/Study";
import { StudyData } from "@/hooks/UseStudyData";
import React, { useCallback } from "react";
import { ChapterSelector } from "./ChapterSelector";
import { StudyAdder } from "./StudyAdder";
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
    (study) => study.name === selectedStudyName,
  );

  const chapterNames: string[] | undefined = selectedStudy?.chapters.map(
    (chapter) => chapter.name,
  );

  const onStudyChange = useCallback(
    (studyName: string) => {
      // TODO: Clean this up
      const selectedStudy: Study | undefined = studies.find(
        (study) => study.name === studyName,
      );

      if (selectedStudy === undefined) {
        throw new Error("Selected study is undefined");
      }

      setSelectedStudyName(studyName);
      // Default all the chapters to selected
      setSelectedChapterNames(
        selectedStudy.chapters.map((chapter) => chapter.name),
      );
    },
    [studies, setSelectedChapterNames, setSelectedStudyName],
  );

  const onStudyDelete = useCallback(
    (studyName: string) => {
      const newStudies = studies.filter((study) => study.name !== studyName);
      setStudies(newStudies);
      if (selectedStudyName === studyName) {
        setSelectedStudyName(undefined);
        setSelectedChapterNames([]);
      }
    },
    [
      studies,
      selectedStudyName,
      setSelectedStudyName,
      setSelectedChapterNames,
      setStudies,
    ],
  );

  return (
    <div className="flex flex-row space-x-4 items-center">
      <StudySelector
        studies={studies}
        selectedStudy={selectedStudyName}
        onStudyChange={onStudyChange}
        onStudyDelete={onStudyDelete}
      />

      <ChapterSelector
        chapters={chapterNames || []}
        selectedChapters={selectedChapterNames}
        setSelectedChapters={setSelectedChapterNames}
      />

      <StudyAdder
        setStudies={setStudies}
        setSelectedStudyName={setSelectedStudyName}
        setSelectedChapterNames={setSelectedChapterNames}
      />
    </div>
  );
};
