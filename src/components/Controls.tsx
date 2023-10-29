import React from "react";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  onShowComments: () => void;
  exploreMode: boolean;
  enterExploreMode: () => void;
  enterLineMode: () => void;
  engineIsEnabled: boolean;
  toggleEngine: () => void;
  databaseIsEnabled: boolean;
  toggleDatabase: () => void;
};

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled, label }) => {
  return (
    <button
      className={`px-4 py-2 text-lg rounded ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : `bg-blue-500 text-white active:bg-blue-700`
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export const Controls: React.FC<ControlProps> = ({
  onNewLine,
  onShowSolution,
  onShowComments,
  exploreMode,
  enterExploreMode,
  enterLineMode,
  engineIsEnabled,
  toggleEngine,
  databaseIsEnabled,
  toggleDatabase,
}) => {
  const exploreModeButtons = <div className="flex space-x-4"></div>;

  const lineModeButtons = (
    <div className="flex space-x-4">
      {/* Buttons for Line Mode */}
      <Button onClick={onNewLine} label="New Line" />
      <Button onClick={onShowSolution} label="Show Solution" />
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-center mb-4 space-x-4">
        <button
          onClick={enterLineMode}
          className={`px-4 py-2 border-b-2 ${
            !exploreMode
              ? "text-gray-500 bg-gray-200 border-transparent"
              : "bg-blue-600 text-white border-blue-600"
          }`}
        >
          Line Mode
        </button>
        <button
          onClick={enterExploreMode}
          className={`px-4 py-2 border-b-2 ${
            exploreMode
              ? "text-gray-500 bg-gray-200 border-transparent"
              : "bg-blue-600 text-white border-blue-600"
          }`}
        >
          Explore Mode
        </button>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={toggleEngine}
          label={engineIsEnabled ? "Hide Engine" : "Show Engine"}
        />
        <Button
          onClick={toggleDatabase}
          label={databaseIsEnabled ? "Hide Database" : "Show Database"}
        />
        <Button onClick={onShowComments} label="Show Comments" />
      </div>

      <div className="flex justify-center space-x-4">
        {exploreMode ? exploreModeButtons : lineModeButtons}
      </div>
    </div>
  );
};
