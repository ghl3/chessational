import { Study } from "@/chess/Study";
import React, { useRef } from "react";
import StudyDeleteButton from "./StudyDeleteButton";
import { StudyRefreshButton } from "./StudyRefreshButton";

interface StudyCardProps {
  study: Study;
  deleteStudy: (studyName: string) => void;
  refreshStudy: (study: Study) => void;
  selectStudy: (studyName: string) => void;
  isSelected?: boolean;
}

const StudyCard: React.FC<StudyCardProps> = ({
  study,
  deleteStudy,
  refreshStudy,
  selectStudy,
  isSelected = false,
}) => {
  // Create refs
  const deleteButtonRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (deleteButtonRef.current?.contains(e.target as Node)) {
      return;
    }
    if (refreshButtonRef.current?.contains(e.target as Node)) {
      return;
    }

    // If not inside button areas, proceed with selecting the study
    selectStudy(study.name);
  };

  return (
    <div
      className={`max-w-md bg-gray-800 rounded-lg border ${
        isSelected ? "border-blue-500" : "border-gray-700"
      } shadow-md overflow-hidden transition duration-300 ease-in-out hover:bg-gray-700`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between p-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex-grow mr-4">
          {study.name}
        </h2>
        <div className="flex gap-2">
          <div ref={refreshButtonRef}>
            <StudyRefreshButton study={study} refreshStudy={refreshStudy} />
          </div>
          <div ref={deleteButtonRef}>
            <StudyDeleteButton study={study} deleteStudy={deleteStudy} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
