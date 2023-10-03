import CheckboxDropdown, { Option } from "./CheckboxDropdown";

interface ChapterSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  chapters: string[];
  selectedChapters: string[] | null;
  setSelectedChapters: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedChapters,
  setSelectedChapters,
}) => {
  const options: Option[] = chapters.map((chapter) => ({
    value: chapter,
    label: chapter,
  }));

  return (
    <CheckboxDropdown
      text={"Select Chapters"}
      options={options}
      selectedOptions={selectedChapters || []}
      setSelectedOptions={setSelectedChapters}
    />
  );
};
