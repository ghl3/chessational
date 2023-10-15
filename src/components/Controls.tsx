import React from "react";

type ControlProps = {
  onNewLine: () => void;
  onShowSolution: () => void;
  onShowComments: () => void;
  exploreMode: boolean;
  toggleExploreMode: () => void;
  engineIsEnabled: boolean;
  toggleEngine: () => void;
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
  toggleExploreMode,
  engineIsEnabled,
  toggleEngine,
}) => {
  return (
    <div className="p-5">
      <div className="flex space-x-4 mb-2">
        <Button onClick={onNewLine} label="New Line" />
        <Button
          onClick={!exploreMode ? onShowSolution : undefined}
          disabled={exploreMode}
          label="Show Solution"
        />
        <Button
          onClick={toggleExploreMode}
          label={exploreMode ? "Return to Line" : "Explore Mode"}
        />
      </div>
      <div className="flex space-x-4">
        <Button
          onClick={!exploreMode ? onShowComments : undefined}
          disabled={exploreMode}
          label="Show Comments"
        />
        <Button
          onClick={toggleEngine}
          label={engineIsEnabled ? "Hide Engine" : "Show Engine"}
        />
      </div>
    </div>
  );
};
