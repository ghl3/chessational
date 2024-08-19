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
  return line.positions.some(
    (position) =>
      position.lastMove?.san.toLowerCase().includes(normalizedQuery),
  );
};

const makeSuggestions = (lines: Line[], query: string): string[] => {
  const moves = new Set<string>();
  const normalizedQuery = query.toLowerCase();

  for (let line of lines) {
    for (let position of line.positions) {
      if (
        position.lastMove &&
        position.lastMove.san.toLowerCase().startsWith(normalizedQuery)
      ) {
        moves.add(position.lastMove.san);
      }
    }
  }

  return Array.from(moves).slice(0, 10); // Limit to 10 suggestions
};

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSelect }) => {
  return (
    <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {suggestions.map((suggestion) => (
        <li
          key={suggestion}
          className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
};

interface SearchBarProps {
  lines: Line[];
  setFilteredLines: Dispatch<SetStateAction<Line[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ lines, setFilteredLines }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered =
      query === "" ? lines : lines.filter((line) => matchesQuery(line, query));
    setFilteredLines(filtered);
  }, [query, lines, setFilteredLines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const suggestions = useMemo(
    () => makeSuggestions(lines, query),
    [lines, query],
  );

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
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
      {isOpen && suggestions.length > 0 && (
        <Suggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
        />
      )}
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

  const onRowClick = (line: Line) => {
    console.log(line);
  };

  return (
    <div>
      <SuperTable columns={columns} data={lines} onRowClick={onRowClick} />
    </div>
  );
};

interface SearchProps {
  lines: Line[];
}

const Search: React.FC<SearchProps> = ({ lines }) => {
  const [filteredLines, setFilteredLines] = useState<Line[]>(lines);

  if (lines.length === 0) {
    return (
      <div className="text-gray-800 dark:text-gray-200">
        Select a chapter first
      </div>
    );
  }

  return (
    <>
      <SearchBar lines={lines} setFilteredLines={setFilteredLines} />
      <SelectedLines lines={filteredLines} />
    </>
  );
};

export default Search;
