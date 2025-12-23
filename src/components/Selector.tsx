import React, { useCallback, useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Optional group/section this option belongs to */
  group?: string;
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
  /** Show group headers when options have groups */
  showGroupHeaders?: boolean;
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
      showGroupHeaders = true,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [dropdownPosition, setDropdownPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

    // Calculate dropdown position when opening
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4, // 4px gap
          left: rect.left,
          width: rect.width,
        });
      }
    }, [isOpen]);

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

    // Close dropdown on scroll (since we use fixed positioning)
    useEffect(() => {
      if (!isOpen) return;

      const handleScroll = () => {
        // Recalculate position on scroll
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
        }
      };

      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }, [isOpen]);

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
    const enabledOptions = options.filter((opt) => !opt.disabled);

    // Group options by their group property
    const groupedOptions = React.useMemo(() => {
      if (!showGroupHeaders) return null;
      
      const groups: { group: string | null; options: SelectOption[] }[] = [];
      let currentGroup: string | null = null;
      let currentOptions: SelectOption[] = [];

      for (const option of options) {
        const optionGroup = option.group ?? null;
        if (optionGroup !== currentGroup) {
          if (currentOptions.length > 0) {
            groups.push({ group: currentGroup, options: currentOptions });
          }
          currentGroup = optionGroup;
          currentOptions = [option];
        } else {
          currentOptions.push(option);
        }
      }
      if (currentOptions.length > 0) {
        groups.push({ group: currentGroup, options: currentOptions });
      }
      return groups;
    }, [options, showGroupHeaders]);

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

    const handleSelectAll = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(enabledOptions.map((opt) => opt.value));
      },
      [enabledOptions, onChange],
    );

    const handleClearAll = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
      },
      [onChange],
    );

    const renderOption = (option: SelectOption, globalIndex: number) => {
      const validIndex = validOptions.findIndex((opt) => opt.value === option.value);
      return (
        <div
          key={option.value}
          ref={(el) => {
            if (validIndex !== -1) optionsRef.current[validIndex] = el;
          }}
          className={`
            p-2 cursor-pointer transition-colors
            ${
              option.disabled
                ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                : "hover:bg-gray-700"
            }
            ${
              !option.disabled && focusedIndex === validIndex
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
          <span className={option.disabled ? "text-gray-500" : ""}>
            {option.label}
          </span>
        </div>
      );
    };

    return (
      <div
        ref={containerRef}
        className={`relative ${className}`}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div
          ref={triggerRef}
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

        {isOpen && dropdownPosition && (
          <div
            className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-auto"
            style={{
              zIndex: 50,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              // Responsive max-height: min of 50% viewport or 400px, but at least 200px
              maxHeight: "min(50vh, 400px)",
            }}
            role="listbox"
            aria-multiselectable={multiSelect}
          >
            {/* Select All / Clear All at the TOP for multi-select */}
            {multiSelect && options.length > 1 && (
              <div className="flex justify-between items-center p-2 border-b border-gray-700 sticky top-0 bg-gray-800 z-20">
                <span className="text-xs text-gray-400">
                  {selectedValues.length} of {enabledOptions.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-0.5 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:text-white transition-colors duration-200"
                    onClick={handleSelectAll}
                  >
                    All
                  </button>
                  <button
                    className="px-2 py-0.5 text-xs text-gray-300 bg-gray-700 rounded hover:bg-gray-600 hover:text-white transition-colors duration-200"
                    onClick={handleClearAll}
                  >
                    None
                  </button>
                </div>
              </div>
            )}

            {/* Render options with optional group headers */}
            {showGroupHeaders && groupedOptions ? (
              groupedOptions.map(({ group, options: groupOpts }, groupIndex) => (
                <div key={group ?? `group-${groupIndex}`}>
                  {group && (
                    <div 
                      className="px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 border-b border-gray-700 uppercase tracking-wider sticky z-10"
                      style={{ 
                        // Position below the All/None header (which is ~36px tall)
                        // All group headers share the same top so they push each other naturally
                        top: multiSelect && options.length > 1 ? "36px" : "0px" 
                      }}
                    >
                      {group}
                    </div>
                  )}
                  {groupOpts.map((option) => {
                    const globalIndex = options.findIndex((o) => o.value === option.value);
                    return renderOption(option, globalIndex);
                  })}
                </div>
              ))
            ) : (
              options.map((option, index) => renderOption(option, index))
            )}
          </div>
        )}
      </div>
    );
  },
);

Selector.displayName = "Selector";

export default Selector;
