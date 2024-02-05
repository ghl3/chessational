import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import React from "react";
import StudyCard from "./StudyCard";

interface StudyCardListProps {
  studies: Study[];
  selectedStudy: Study | null;
  selectStudy: (studyName: string) => void;
  loadStudy: (studyId: string) => Promise<StudyChapterAndLines>;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
  deleteStudy: (studyName: string) => void;
}

const StudyCardList: React.FC<StudyCardListProps> = ({
  studies,
  selectedStudy,
  selectStudy,
  loadStudy,
  addStudyAndChapters,
  deleteStudy,
}) => {
  return (
    <div className="space-y-4">
      {studies.map((study) => (
        <div
          key={study.name}
          onClick={() => selectStudy(study.name)}
          className="cursor-pointer transition-opacity duration-300 ease-in-out"
        >
          <StudyCard
            study={study}
            loadStudy={loadStudy}
            addStudyAndChapters={addStudyAndChapters}
            deleteStudy={deleteStudy}
            isSelected={selectedStudy?.name === study.name}
          />
        </div>
      ))}
    </div>
  );
};

export default StudyCardList;
