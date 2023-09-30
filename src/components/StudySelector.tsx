import React from "react";

type StudyProps = {
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onStudySubmit?: () => void;
};

export const StudySelector: React.FC<StudyProps> = ({
  selectedStudy,
  onStudyChange,
  onStudySubmit,
}) => {
  const handleStudyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStudyChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onStudySubmit?.();
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Lichess Study URL"
        value={selectedStudy || ""}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />
      <button onClick={onStudySubmit}>Get Study</button>
    </div>
  );
};
