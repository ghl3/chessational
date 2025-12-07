import { Line } from "@/chess/Line";
import { LineAndChapter } from "@/chess/StudyChapterAndLines";
import { Token, tokenizeQuery } from "@/utils/Tokenizer";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export const matchesQuery = (line: Line, tokens: Token[]): boolean => {
  const positions = line.positions.flatMap((position) => {
    return position.lastMove ? [position.lastMove.san] : [];
  });

  return tokens
    .filter((token) => token.type === "move")
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
  if (partialToken === undefined) {
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
    <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {suggestions.map((suggestion) => (
        <li
          key={suggestion}
          className="px-4 py-2 cursor-pointer hover:bg-gray-600 text-gray-100"
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
  if (partialToken === undefined) {
    return query;
  }

  const newQuery = tokens
    .filter((token) => token.type === "move")
    .map((token) => token.token)
    .join(" ");

  return newQuery + " " + suggestion;
};

interface SearchBarProps {
  filteredLines: LineAndChapter[];
  tokens: Token[];
  setTokens: Dispatch<SetStateAction<Token[]>>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filteredLines,
  tokens,
  setTokens,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setTokens(tokenizeQuery(e.target.value));
    setIsOpen(true);
  };

  const suggestions = useMemo(
    () => makeSuggestions(filteredLines, tokens),
    [filteredLines, tokens],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      const newQuery = mergeSuggestionWithQuery(query, tokens, suggestion);
      setQuery(newQuery);
      setTokens(tokenizeQuery(newQuery));
      setIsOpen(false);
    },
    [query, tokens, setTokens],
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
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
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
