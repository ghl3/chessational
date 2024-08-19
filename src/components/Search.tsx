import { Line } from "@/chess/Line";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

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

const SelectableLine: React.FC<Line> = (line: Line) => {
  const handleSelectLine = (line: Line) => {
    console.log("Selected line:", line);
  };

  const lineString = line.positions
    .map((position) => position.lastMove?.san)
    .join(" ");

  return (
    <div key={line.lineId} className="p-2">
      <button
        onClick={() => handleSelectLine(line)}
        className="w-full text-left hover:bg-blue-100"
      >
        {lineString}
      </button>
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
    <div className="p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Chess Opening Explorer
      </h1>
      <SearchBar lines={lines} setFilteredLines={setFilteredLines} />
      {filteredLines.map((line, index) => SelectableLine(line))}
    </div>
  );
};

export default Search;
