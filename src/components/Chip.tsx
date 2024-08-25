import React from "react";

interface ChipProps {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: string;
  isRemovable?: boolean;
  removeButtonStyle?: string;
}

const Chip: React.FC<ChipProps> = ({
  label,
  onClick,
  style = "blue",
  removeButtonStyle = "blue",
  isRemovable = false,
}) => {
  const baseClasses =
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out";

  return (
    <span
      className={`${baseClasses} ${style} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {label}
      {isRemovable && (
        <button
          type="button"
          className={`flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center ${removeButtonStyle} transition-colors duration-200 ease-in-out`}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(e);
          }}
        >
          <span className="sr-only">Remove {label}</span>
          <svg
            className="h-2 w-2"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 8 8"
          >
            <path
              strokeLinecap="round"
              strokeWidth="1.5"
              d="M1 1l6 6m0-6L1 7"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Chip;
