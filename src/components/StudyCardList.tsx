import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import React from "react";
import StudyCard from "./StudyCard";

interface StudyCardListProps {
  studies: Study[];
  selectedStudy: Study | null;
  selectStudy: (studyName: string) => void;
  deleteStudy: (studyName: string) => void;
  refreshStudy: (study: Study) => void;
}

const StudyCardList: React.FC<StudyCardListProps> = ({
  studies,
  selectedStudy,
  selectStudy,
  deleteStudy,
  refreshStudy,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {studies.map((study) => (
        <StudyCard
          key={study.name}
          study={study}
          selectStudy={selectStudy}
          deleteStudy={deleteStudy}
          refreshStudy={refreshStudy}
          isSelected={selectedStudy?.name === study.name}
        />
      ))}
    </div>
  );
};

export default StudyCardList;
