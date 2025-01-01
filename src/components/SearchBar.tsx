import { Chapter } from "@/chess/Chapter";
import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { ChessboardState } from "@/hooks/UseChessboardState";
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
import { makePositionChips } from "./PositionChip";
import { BaseStudyRow, StudyTable } from "./StudyTable";

const matchesQuery = (line: Line, tokens: Token[]): boolean => {
  const positions = line.positions.flatMap((position) => {
    return position.lastMove ? [position.lastMove.san] : [];
  });

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

export const SearchBar: React.FC<SearchBarProps> = ({
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
  }, [query, lines, setFilteredLines, tokens]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const suggestions = useMemo(
    () => makeSuggestions(filteredLines, tokens),
    [filteredLines, tokens],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setQuery((query) => mergeSuggestionWithQuery(query, tokens, suggestion));
      setIsOpen(false);
    },
    [tokens, setQuery, setIsOpen],
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
