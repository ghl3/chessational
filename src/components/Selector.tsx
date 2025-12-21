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
  formatMultipleDisplay?: (selectedOptions: SelectOption[]) => string;
  displayAllValues?: boolean;
  renderDisplay?: (selectedOptions: SelectOption[]) => React.ReactNode;
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
      formatMultipleDisplay,
      displayAllValues,
      renderDisplay,
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

      if (renderDisplay) return renderDisplay(selectedOptions);
      if (formatMultipleDisplay) return formatMultipleDisplay(selectedOptions);
      if (displayAllValues) {
        return selectedOptions.map((opt) => opt.label).join(", ");
      }

      return selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} items selected`;
    }, [
      options,
      selectedValues,
      multiSelect,
      placeholder,
      renderDisplay,
      formatMultipleDisplay,
      displayAllValues,
    ]);

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
          w-full p-2 rounded-lg
          flex justify-between items-center
          transition-colors duration-200
          border
          ${
            disabled
              ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600"
              : "bg-gray-800 text-gray-200 hover:text-white hover:bg-gray-700 cursor-pointer border-blue-600/60 hover:border-blue-500"
          }
          ${error ? "border-2 border-rose-500" : ""}
          ${isOpen ? "border-blue-500 text-white bg-gray-700" : ""}
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
            className="absolute left-0 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
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
                p-2 cursor-pointer transition-colors
                ${
                  option.disabled
                    ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                    : "hover:bg-gray-700"
                }
                ${
                  !option.disabled &&
                  focusedIndex ===
                    validOptions.findIndex((opt) => opt.value === option.value)
                    ? "bg-gray-700 text-white"
                    : selectedValues.includes(option.value)
                    ? "bg-gray-700/50 text-white"
                    : "text-gray-300"
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
                    className="mr-2 accent-blue-500"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                )}
                <span
                  className={
                    option.disabled ? "text-gray-500" : ""
                  }
                >
                  {option.label}
                </span>
              </div>
            ))}

            {multiSelect && options.length > 1 && (
              <div className="flex justify-between p-2 border-t border-gray-700">
                <button
                  className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:text-white transition-colors duration-200"
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
                  className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:text-white transition-colors duration-200"
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
