"use client";

import { Study } from "@/chess/Study";
import { Button } from "./Button";

interface StudyRefreshButtonProps {
  study: Study;
  refreshStudy: (study: Study) => void;
}

export const StudyRefreshButton: React.FC<StudyRefreshButtonProps> = ({
  study,
  refreshStudy,
}) => {
  return (
    <Button
      label="Refresh"
      variant="primary"
      size="small"
      onClick={() => refreshStudy(study)}
    />
  );
};
