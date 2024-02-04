import { Study } from "@/chess/Study";
import { StudyChapterAndLines } from "@/chess/StudyChapterAndLines";
import React from "react";
import StudyDeleteButton from "./StudyDeleteButton";
import { StudyRefreshButton } from "./StudyRefreshButton";

interface StudyCardProps {
  study: Study;
  deleteStudy: (studyName: string) => void;
  addStudyAndChapters: (study: StudyChapterAndLines) => void;
  isSelected?: boolean;
}

const StudyCard: React.FC<StudyCardProps> = ({
  study,
  addStudyAndChapters,
  deleteStudy,
  isSelected = false,
}) => {
  return (
    <div
      className={`max-w-md bg-gray-800 rounded-lg border ${
        isSelected ? "border-blue-500" : "border-gray-700"
      } shadow-md overflow-hidden transition duration-300 ease-in-out hover:bg-gray-700`}
    >
      <div className="flex items-center justify-between p-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex-grow mr-4">
          {study.name}
        </h2>
        <div className="flex gap-2">
          <StudyRefreshButton
            study={study}
            deleteStudy={deleteStudy}
            addStudyAndChapters={addStudyAndChapters}
          />
          <StudyDeleteButton study={study} deleteStudy={deleteStudy} />
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
