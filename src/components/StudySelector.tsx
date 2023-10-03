import { Study } from "@/hooks/UseStudyData";

interface StudySelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  studies: Study[];
  selectedStudy?: string;
  onStudyChange?: (study: string) => void;
}

export const StudySelector: React.FC<StudySelectorProps> = ({
  studies,
  selectedStudy,
  onStudyChange,
}) => {
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStudyChange?.(e.target.value);
  };

  return (
    <div className="flex space-x-4">
      <select
        className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        value={selectedStudy}
        onChange={handleDropdownChange}
      >
        <option value="" disabled>
          Select a study
        </option>
        {studies.map((study) => (
          <option key={study.name} value={study.name}>
            {study.name}
          </option>
        ))}
      </select>
    </div>
  );
};
