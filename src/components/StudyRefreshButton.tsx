"use client";

import { Study } from "@/chess/Study";

interface StudyRefreshButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  study: Study;
  refreshStudy: (study: Study) => void;
}

export const StudyRefreshButton: React.FC<StudyRefreshButtonProps> = ({
  study,
  refreshStudy,
}) => {
  return (
    <button
      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:outline-hidden focus:ring-blue-300"
      onClick={async () => refreshStudy(study)}
    >
      Refresh Study
    </button>
  );
};
