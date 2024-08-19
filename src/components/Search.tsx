import { Line } from "@/chess/Line";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SuperTable from "./SuperTable";

const matchesQuery = (line: Line, query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  const positions = line.positions.map(
    (position) => position.lastMove?.san.toLowerCase(),
  );
  return positions.includes(normalizedQuery);
};

interface SearchBarProps {
  lines: Line[];
  setFilteredLines: Dispatch<SetStateAction<Line[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ lines, setFilteredLines }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query === "") {
      setFilteredLines(lines);
    } else {
      const filtered = lines.filter((line) => {
        return matchesQuery(line, query);
      });
      setFilteredLines(filtered);
    }
  }, [query, lines, setFilteredLines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="relative w-64">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        placeholder="Search chess lines..."
      />
    </div>
  );
};

interface SelectedLinesProps {
  lines: Line[];
}

const SelectedLines: React.FC<SelectedLinesProps> = ({ lines }) => {
  const columns = useMemo(
    () => [
      {
        // first group - TV Show
        Header: "Lines",
        // First group columns
        columns: [
          {
            Header: "Study",
            id: "study",
            accessor: "studyName",
          },
          {
            Header: "Chater",
            id: "chapter",
            accessor: "chapterName",
          },
          {
            Header: "Line",
            id: "lineId",
            accessor: "lineId",
          },
        ],
      },
    ],
    [],
  );

  return (
    <div>
      <SuperTable columns={columns} data={lines} />
    </div>
  );
};

interface SearchProps {
  lines: Line[];
}

const Search: React.FC<SearchProps> = ({ lines }) => {
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);

  if (lines.length === 0) {
    return <div>Select a chapter first</div>;
  }

  return (
    <>
      <SearchBar lines={lines} setFilteredLines={setFilteredLines} />
      <SelectedLines lines={filteredLines} />
    </>
  );
};

export default Search;
