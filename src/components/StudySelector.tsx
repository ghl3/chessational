import React from "react";

type StudyProps = {
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
};

export const StudySelector: React.FC<StudyProps> = ({
  selectedStudy,
  onStudyChange,
}) => {
  const handleStudyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStudyChange?.(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="Enter Lichess Study URL"
      value={selectedStudy || ""}
      onChange={handleStudyUrlChange}
    />
  );
};
