import React, { useCallback, useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectorProps {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  onBlur?: () => void;
}

const Selector = React.forwardRef<HTMLDivElement, SelectorProps>(
  (
    {
      options,
      selectedValues,
      onChange,
      placeholder = "Select...",
      multiSelect = false,
      disabled = false,
      error = false,
      className = "",
      onBlur,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          onBlur?.();
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen, onBlur]);

    const handleOptionClick = useCallback(
      (value: string, optionDisabled?: boolean) => {
        if (optionDisabled) return;

        onChange(
          multiSelect
            ? selectedValues.includes(value)
              ? selectedValues.filter((v) => v !== value)
              : [...selectedValues, value]
            : [value],
        );

        if (!multiSelect) {
          setIsOpen(false);
        }
      },
      [multiSelect, selectedValues, onChange],
    );

    const getDisplayText = useCallback(() => {
      const selectedOptions = options.filter((opt) =>
        selectedValues.includes(opt.value),
      );
      if (selectedValues.length === 0) return placeholder;
      if (!multiSelect) return selectedOptions[0]?.label || placeholder;
      return selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} items selected`;
    }, [options, selectedValues, multiSelect, placeholder]);

    // Filter out disabled options for keyboard navigation
    const validOptions = options.filter((opt) => !opt.disabled);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            if (isOpen && focusedIndex >= 0) {
              handleOptionClick(validOptions[focusedIndex].value);
            } else {
              setIsOpen(true);
            }
            break;
          case "Escape":
            setIsOpen(false);
            setFocusedIndex(-1);
            onBlur?.();
            break;
          case " ":
            if (!isOpen) {
              e.preventDefault();
              setIsOpen(true);
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            }
            setFocusedIndex((prev) => {
              const nextIndex = prev < validOptions.length - 1 ? prev + 1 : 0;
              // Scroll the option into view if needed
              optionsRef.current[nextIndex]?.scrollIntoView({
                block: "nearest",
              });
              return nextIndex;
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) => {
              const nextIndex = prev > 0 ? prev - 1 : validOptions.length - 1;
              // Scroll the option into view if needed
              optionsRef.current[nextIndex]?.scrollIntoView({
                block: "nearest",
              });
              return nextIndex;
            });
            break;
        }
      },
      [isOpen, focusedIndex, validOptions, handleOptionClick, onBlur],
    );

    return (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className={`
          w-full p-2 text-white rounded
          flex justify-between items-center
          transition-colors duration-200
          ${
            disabled
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700 cursor-pointer"
          }
          ${error ? "border-2 border-red-500" : ""}
          ${isOpen ? "ring-2 ring-blue-400" : ""}
        `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">{getDisplayText()}</span>
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {isOpen && (
          <div
            className="absolute left-0 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto"
            style={{ zIndex: 20 }}
            role="listbox"
            aria-multiselectable={multiSelect}
          >
            {options.map((option) => (
              <div
                key={option.value}
                ref={(el) => {
                  const index = validOptions.findIndex(
                    (opt) => opt.value === option.value,
                  );
                  if (index !== -1) optionsRef.current[index] = el;
                }}
                className={`
                p-2 cursor-pointer
                ${
                  option.disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-blue-200 hover:ring-2 hover:ring-blue-400 hover:ring-inset"
                }
                ${
                  !option.disabled &&
                  focusedIndex ===
                    validOptions.findIndex((opt) => opt.value === option.value)
                    ? "bg-blue-200 ring-2 ring-blue-400 ring-inset"
                    : selectedValues.includes(option.value)
                    ? "bg-blue-50"
                    : ""
                }
              `}
                onClick={() => handleOptionClick(option.value, option.disabled)}
                role="option"
                aria-selected={selectedValues.includes(option.value)}
              >
                {multiSelect && (
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => {}}
                    disabled={option.disabled}
                    className="mr-2"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                )}
                <span
                  className={
                    option.disabled ? "text-gray-400" : "text-gray-900"
                  }
                >
                  {option.label}
                </span>
              </div>
            ))}

            {multiSelect && options.length > 1 && (
              <div className="flex justify-between p-2 border-t border-gray-200">
                <button
                  className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-700 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(
                      options
                        .filter((opt) => !opt.disabled)
                        .map((opt) => opt.value),
                    );
                  }}
                >
                  Select All
                </button>
                <button
                  className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-700 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

Selector.displayName = "Selector";

export default Selector;
