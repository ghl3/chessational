import CheckboxDropdown, { Option } from "./CheckboxDropdown";

interface ChapterSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  chapters: string[];
  selectedChapters: string[] | null;
  selectChapter: (chapterName: string) => void;
  deselectChapter: (chapterName: string) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedChapters,
  selectChapter,
  deselectChapter,
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
      selectOption={selectChapter}
      deselectOption={deselectChapter}
    />
  );
};
