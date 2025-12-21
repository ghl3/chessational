import { LineStatus } from "@/chess/Line";
import { LineMoveResult } from "@/components/MoveDescription";
import { Color } from "chess.js";
import React, { useEffect, useState } from "react";

export type BannerState = "idle" | "your-turn" | "correct" | "incorrect" | "complete";

export interface StatusBannerProps {
  lineStatus?: LineStatus;
  moveResult?: LineMoveResult;
  orientation?: Color;
}

const getBannerState = (
  lineStatus?: LineStatus,
  moveResult?: LineMoveResult,
): BannerState => {
  // Check for line complete first - this is a terminal state
  if (lineStatus === "LINE_COMPLETE") {
    return "complete";
  }

  // Then check move result for immediate feedback
  if (moveResult === "CORRECT") {
    return "correct";
  }
  if (moveResult === "INCORRECT") {
    return "incorrect";
  }

  // Then check if awaiting user move
  if (lineStatus === "WHITE_TO_MOVE" || lineStatus === "BLACK_TO_MOVE") {
    return "your-turn";
  }

  return "idle";
};

const WhitePieceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 45 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="22.5"
      cy="22.5"
      r="18"
      fill="white"
      stroke="#374151"
      strokeWidth="2"
    />
  </svg>
);

const BlackPieceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 45 45"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="22.5"
      cy="22.5"
      r="18"
      fill="#374151"
      stroke="#6B7280"
      strokeWidth="2"
    />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 6l12 12M6 18L18 6"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 21h8m-4-4v4m-5-8c-1.5 0-3-1-3-3V6h16v4c0 2-1.5 3-3 3m-10 0h10m-10 0c0 2.5 2 5 5 5s5-2.5 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StatusBanner: React.FC<StatusBannerProps> = ({
  lineStatus,
  moveResult,
  orientation,
}) => {
  const bannerState = getBannerState(lineStatus, moveResult);
  const [showFlash, setShowFlash] = useState(false);

  // Trigger flash animation when we get a correct move or complete a line
  useEffect(() => {
    if (moveResult === "CORRECT" || lineStatus === "LINE_COMPLETE") {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [moveResult, lineStatus]);

  // Don't render anything in idle state
  if (bannerState === "idle") {
    return null;
  }

  const isWhiteToMove = lineStatus === "WHITE_TO_MOVE";

  const getBannerContent = () => {
    switch (bannerState) {
      case "your-turn":
        return (
          <>
            {isWhiteToMove ? (
              <WhitePieceIcon className="w-6 h-6" />
            ) : (
              <BlackPieceIcon className="w-6 h-6" />
            )}
            <span className="font-semibold">Your move</span>
          </>
        );
      case "correct":
        return (
          <>
            <CheckIcon className="w-6 h-6" />
            <span className="font-semibold">Correct!</span>
          </>
        );
      case "incorrect":
        return (
          <>
            <XIcon className="w-6 h-6" />
            <span className="font-semibold">Incorrect — try again</span>
          </>
        );
      case "complete":
        return (
          <>
            <TrophyIcon className="w-6 h-6" />
            <span className="font-semibold">Line complete!</span>
          </>
        );
      default:
        return null;
    }
  };

  const getBannerStyles = (): string => {
    const baseStyles =
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200";

    switch (bannerState) {
      case "your-turn":
        return `${baseStyles} bg-blue-900/50 border-2 border-blue-400 text-blue-100 status-banner-pulse`;
      case "correct":
        return `${baseStyles} bg-emerald-900/60 border-2 border-emerald-400 text-emerald-100 ${showFlash ? "status-banner-flash" : ""}`;
      case "incorrect":
        return `${baseStyles} bg-rose-900/50 border-2 border-rose-400 text-rose-100`;
      case "complete":
        return `${baseStyles} bg-emerald-900/50 border-2 border-emerald-400 text-emerald-100 ${showFlash ? "status-banner-flash-green" : ""}`;
      default:
        return baseStyles;
    }
  };

  return <div className={getBannerStyles()}>{getBannerContent()}</div>;
};
