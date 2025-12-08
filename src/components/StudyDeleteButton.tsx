import { Study } from "@/chess/Study";
import { Button } from "./Button";

interface StudyDeleteButtonProps {
  study: Study;
  deleteStudy: (studyName: string) => void;
}

export const StudyDeleteButton: React.FC<StudyDeleteButtonProps> = ({
  study,
  deleteStudy,
}) => {
  return (
    <Button
      label="Delete"
      variant="danger"
      size="small"
      onClick={() => deleteStudy(study.name)}
    />
  );
};

export default StudyDeleteButton;
