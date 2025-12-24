import { LineStatus } from "@/chess/Line";
import { LineMoveResult } from "@/components/MoveDescription";
import React, { useEffect, useState } from "react";

export type BannerState = "idle" | "your-turn" | "incorrect" | "complete";

export interface StatusBannerProps {
  lineStatus?: LineStatus;
  moveResult?: LineMoveResult;
}

const getBannerState = (
  lineStatus?: LineStatus,
  moveResult?: LineMoveResult,
): BannerState => {
  // Check for line complete first - this is a terminal state
  if (lineStatus === "LINE_COMPLETE") {
    return "complete";
  }

  // Check for incorrect move - this needs immediate feedback
  if (moveResult === "INCORRECT") {
    return "incorrect";
  }

  // If it's the user's turn, show "Your move" (with success styling handled separately)
  // This takes priority over CORRECT so we don't flash between "Correct!" and "Your move"
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
}) => {
  const bannerState = getBannerState(lineStatus, moveResult);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showCompleteFlash, setShowCompleteFlash] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  // Trigger green-to-blue flash immediately when moveResult becomes CORRECT.
  // We depend only on moveResult - the rapid-move issue is handled by resetting
  // moveResult to null after opponent plays (in Review.tsx).
  useEffect(() => {
    if (moveResult === "CORRECT") {
      setFlashKey(k => k + 1);
      setShowSuccessFlash(true);
      const timer = setTimeout(() => setShowSuccessFlash(false), 700);
      return () => clearTimeout(timer);
    } else {
      // Clear flash state when moveResult is not CORRECT (e.g., INCORRECT or null)
      setShowSuccessFlash(false);
    }
  }, [moveResult]);

  // Trigger flash for line complete
  useEffect(() => {
    if (lineStatus === "LINE_COMPLETE") {
      setShowCompleteFlash(true);
      const timer = setTimeout(() => setShowCompleteFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lineStatus]);

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
        // When we just had a correct move, flash green-to-blue; otherwise steady blue with pulse
        if (showSuccessFlash) {
          return `${baseStyles} text-blue-100 status-banner-success-to-ready`;
        }
        return `${baseStyles} bg-blue-900/50 border-2 border-blue-400 text-blue-100 status-banner-pulse`;
      case "incorrect":
        return `${baseStyles} bg-rose-900/50 border-2 border-rose-400 text-rose-100`;
      case "complete":
        return `${baseStyles} bg-emerald-900/50 border-2 border-emerald-400 text-emerald-100 ${showCompleteFlash ? "status-banner-flash-green" : ""}`;
      default:
        return baseStyles;
    }
  };

  // Use flashKey to force animation restart when playing quickly
  return <div key={flashKey} className={getBannerStyles()}>{getBannerContent()}</div>;
};
