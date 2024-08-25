import React from "react";

type ChipColor = "blue" | "green" | "red";

interface ChipProps {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  color?: ChipColor;
  isRemovable?: boolean;
}

const Chip: React.FC<ChipProps> = ({
  label,
  onClick,
  color = "blue",
  isRemovable = false,
}) => {
  const baseClasses =
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out";
  const colorClasses: Record<ChipColor, string> = {
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    green: "bg-green-100 text-green-800 hover:bg-green-200",
    red: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  return (
    <span
      className={`${baseClasses} ${colorClasses[color]} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {label}
      {isRemovable && (
        <button
          type="button"
          className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-300 hover:text-blue-600 focus:outline-none focus:bg-blue-500 focus:text-white transition-colors duration-200 ease-in-out"
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
