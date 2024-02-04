import React, { useState } from "react";
import StudyCard from "./StudyCard"; // Ensure this path is correct

interface Study {
  name: string;
  // Add any other properties that the Study type should have
}

interface StudyCardListProps {
  studies: Study[];
  selectedStudy: string | null;
}

const StudyCardList: React.FC<StudyCardListProps> = ({
  studies,
  selectedStudy,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleSelectCard = (studyName: string) => {
    setSelectedCardId(studyName); // Assuming study names are unique
    console.log("Select card", studyName);
  };

  const handleRefresh = (studyName: string) => {
    console.log("Refresh card", studyName);
  };

  const handleDelete = (studyName: string) => {
    console.log("Delete card", studyName);
    // Optionally, implement logic to remove the study from the list
  };

  return (
    <div className="space-y-4">
      {studies.map((study) => (
        <div
          key={study.name}
          onClick={() => handleSelectCard(study.name)}
          className={`cursor-pointer transition-opacity duration-300 ease-in-out ${
            selectedStudy === study.name ? "opacity-100" : "opacity-50"
          }`}
        >
          <StudyCard
            name={study.name}
            onRefresh={() => handleRefresh(study.name)}
            onDelete={() => handleDelete(study.name)}
          />
        </div>
      ))}
    </div>
  );
};

export default StudyCardList;
