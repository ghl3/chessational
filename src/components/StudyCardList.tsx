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
    <div className="space-y-4">
      {studies.map((study) => (
        <div
          key={study.name}
          //onClick={() => selectStudy(study.name)}
          className="cursor-pointer transition-opacity duration-300 ease-in-out"
        >
          <StudyCard
            study={study}
            selectStudy={selectStudy}
            deleteStudy={deleteStudy}
            refreshStudy={refreshStudy}
            isSelected={selectedStudy?.name === study.name}
          />
        </div>
      ))}
    </div>
  );
};

export default StudyCardList;
