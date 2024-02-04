import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import React, { useState } from "react";
import StudyCard from "./StudyCard";

interface StudyCardListProps {
  studies: Study[];
  selectedStudy: Study | null;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
  deleteStudy: (studyName: string) => void;
}

const StudyCardList: React.FC<StudyCardListProps> = ({
  studies,
  selectedStudy,
  addStudyAndChapters,
  deleteStudy,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleSelectCard = (studyName: string) => {
    setSelectedCardId(studyName);
    console.log("Select card", studyName);
  };

  return (
    <div className="space-y-4">
      {studies.map((study) => (
        <div
          key={study.name}
          onClick={() => handleSelectCard(study.name)}
          className={`cursor-pointer transition-opacity duration-300 ease-in-out ${
            selectedStudy?.name === study.name ? "opacity-100" : "opacity-50"
          }`}
        >
          <StudyCard
            study={study}
            addStudyAndChapters={addStudyAndChapters}
            deleteStudy={() => deleteStudy(study.name)}
          />
        </div>
      ))}
    </div>
  );
};

export default StudyCardList;
