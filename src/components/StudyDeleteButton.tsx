import { Study } from "@/chess/Study";

interface StudyDeleteButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  study: Study;
  deleteStudy: (studyName: string) => void;
}

export const StudyDeleteButton: React.FC<StudyDeleteButtonProps> = ({
  study,
  deleteStudy,
}) => {
  return (
    <button
      onClick={() => deleteStudy(study.name)}
      className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300"
    >
      Delete
    </button>
  );
};

export default StudyDeleteButton;
