import React from "react";

interface StudyProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
  onStudySubmit?: () => void;
}

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
    <div className="flex space-x-4">
      <input
        className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        type="text"
        placeholder="Enter Lichess Study URL"
        value={selectedStudy || ""}
        onChange={handleStudyUrlChange}
        onKeyDown={handleKeyDown}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
        onClick={onStudySubmit}
      >
        Get Study
      </button>
    </div>
  );
};
