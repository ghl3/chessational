import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { CurrentLineData } from "@/hooks/UseCurrentLineData";
import { Token, tokenizeQuery } from "@/utils/Tokenizer";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SuperTable from "./SuperTable";

const matchesQuery = (line: Line, tokens: Token[]): boolean => {
  const positions = line.positions.flatMap((position) => {
    return position.lastMove ? [position.lastMove.san] : [];
  });

  // Check if all the tokens are present in the line
  return tokens
    .filter((token) => token.type == "move")
    .every((token) => {
      return positions.some((position) => position.includes(token.token));
    });
};

const makeSuggestions = (
  lines: LineAndChapter[],
  tokens: Token[],
): string[] => {
  const moves = new Set<string>();

  const partialToken = tokens.find((token) => token.type === "partial");
  if (partialToken == undefined) {
    return [];
  }

  for (let line of lines) {
    for (let position of line.line.positions) {
      if (
        position.lastMove &&
        position.lastMove.san.startsWith(partialToken.token)
      ) {
        moves.add(position.lastMove.san);
      }
    }
  }

  return Array.from(moves).slice(0, 10);
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

const mergeSuggestionWithQuery = (
  query: string,
  tokens: Token[],
  suggestion: string,
): string => {
  //const tokens = tokenizeQuery(query);
  const partialToken = tokens.find((token) => token.type === "partial");
  if (partialToken == undefined) {
    return query;
  }

  const newQuery = tokens
    .filter((token) => token.type === "move")
    .map((token) => token.token)
    .join(" ");

  return newQuery + " " + suggestion;
};

interface SearchBarProps {
  lines: LineAndChapter[];
  filteredLines: LineAndChapter[];
  setFilteredLines: Dispatch<SetStateAction<LineAndChapter[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  lines,
  filteredLines,
  setFilteredLines,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tokens = useMemo(() => tokenizeQuery(query), [query]);

  useEffect(() => {
    const filtered =
      query === ""
        ? lines
        : lines.filter((line) => matchesQuery(line.line, tokens));
    setFilteredLines(filtered);
  }, [query, lines, setFilteredLines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const suggestions = useMemo(
    () => makeSuggestions(filteredLines, tokens),
    [lines, query],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setQuery((query) => mergeSuggestionWithQuery(query, tokens, suggestion));
      setIsOpen(false);
    },
    [query, tokens, setQuery, setIsOpen],
  );

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
  lineAndChapters: LineAndChapter[];
  currentLineData: CurrentLineData;
}

const SelectedLines: React.FC<SelectedLinesProps> = ({
  lineAndChapters,
  currentLineData,
}) => {
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
            accessor: "line.studyName",
          },
          {
            Header: "Chater",
            id: "chapter",
            accessor: "line.chapterName",
          },
          {
            Header: "Line",
            id: "lineId",
            accessor: "line.lineId",
          },
        ],
      },
    ],
    [],
  );

  const onRowClick = (lineAndChapter: LineAndChapter) => {
    currentLineData.setLineAndChapter(lineAndChapter); //  setCurrentLine(line);
  };

  return (
    <div>
      <SuperTable
        columns={columns}
        data={lineAndChapters}
        onRowClick={onRowClick}
      />
    </div>
  );
};

interface SearchProps {
  lines: Line[];
  chapters: Chapter[];
  currentLineData: CurrentLineData;
}

const Search: React.FC<SearchProps> = ({
  lines,
  chapters,
  currentLineData,
}) => {
  const lineAndChapters = useMemo(() => {
    return lines.map((line) => {
      const chapter = chapters.find(
        (chapter) => chapter.name === line.chapterName,
      );
      if (chapter == undefined) {
        throw new Error(`Chapter ${line.chapterName} not found`);
      }
      return {
        line: line,
        chapter: chapter,
      };
    });
  }, [lines, chapters]);

  const [filteredLines, setFilteredLines] =
    useState<LineAndChapter[]>(lineAndChapters);

  if (lines.length === 0) {
    return (
      <div className="text-gray-800 dark:text-gray-200">
        Select a chapter first
      </div>
    );
  }

  return (
    <>
      <SearchBar
        lines={lineAndChapters}
        filteredLines={filteredLines}
        setFilteredLines={setFilteredLines}
      />
      <SelectedLines
        lineAndChapters={filteredLines}
        currentLineData={currentLineData}
      />
    </>
  );
};

export default Search;
