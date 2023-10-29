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
      <div className="flex justify-center mb-4 space-x-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
        <button
          onClick={enterLineMode}
          className={`inline-block p-4 rounded-t-lg ${
            !exploreMode
              ? "text-white bg-gray-700"
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Review Lines
        </button>
        <button
          onClick={enterExploreMode}
          className={`inline-block p-4 rounded-t-lg ${
            exploreMode
              ? "text-white bg-gray-700 "
              : "hover:text-gray-600 hover:bg-gray-50 "
          }`}
        >
          Explore
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
