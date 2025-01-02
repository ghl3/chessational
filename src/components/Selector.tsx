import React, { useCallback, useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type HTMLDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">;

interface SelectorProps extends HTMLDivProps {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  renderDisplay?: (selectedOptions: SelectOption[]) => React.ReactNode;
  formatMultipleDisplay?: (selectedOptions: SelectOption[]) => string;
  displayAllValues?: boolean;
  onBlur?: () => void;
  error?: boolean;
}

const Selector = React.forwardRef<HTMLDivElement, SelectorProps>(
  (
    {
      options,
      selectedValues,
      onChange,
      placeholder = "Select...",
      multiSelect = false,
      className = "",
      disabled = false,
      required = false,
      name,
      renderDisplay,
      formatMultipleDisplay,
      displayAllValues,
      onBlur,
      error,
      id,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [buttonWidth, setButtonWidth] = useState(0);

    useEffect(() => {
      const updateWidth = () => {
        if (buttonRef.current) {
          setButtonWidth(buttonRef.current.offsetWidth);
        }
      };

      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }, []);

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

    const toggleDropdown = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
      }
    }, [disabled]);

    const handleOptionClick = useCallback(
      (value: string, optionDisabled?: boolean) => {
        if (optionDisabled) return;

        if (multiSelect) {
          onChange(
            selectedValues.includes(value)
              ? selectedValues.filter((v) => v !== value)
              : [...selectedValues, value],
          );
        } else {
          onChange([value]);
          setIsOpen(false);
        }
      },
      [multiSelect, selectedValues, onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const validOptions = options.filter((opt) => !opt.disabled);

        switch (e.key) {
          case "Enter":
            e.preventDefault();
            if (isOpen && focusedIndex >= 0) {
              handleOptionClick(validOptions[focusedIndex].value);
            } else {
              toggleDropdown();
            }
            break;
          case " ":
            e.preventDefault();
            if (!isOpen) toggleDropdown();
            break;
          case "Escape":
            setIsOpen(false);
            onBlur?.();
            break;
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            }
            setFocusedIndex((prev) =>
              prev < validOptions.length - 1 ? prev + 1 : 0,
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) =>
              prev > 0 ? prev - 1 : validOptions.length - 1,
            );
            break;
        }
      },
      [
        isOpen,
        focusedIndex,
        options,
        handleOptionClick,
        toggleDropdown,
        onBlur,
      ],
    );

    const selectAll = useCallback(() => {
      onChange(options.filter((opt) => !opt.disabled).map((opt) => opt.value));
    }, [options, onChange]);

    const clearAll = useCallback(() => {
      onChange([]);
      if (!multiSelect) {
        setIsOpen(false);
      }
    }, [onChange, multiSelect]);

    const getSelectedOptions = useCallback(
      () => options.filter((opt) => selectedValues.includes(opt.value)),
      [options, selectedValues],
    );

    const getDisplayText = useCallback(() => {
      const selectedOptions = getSelectedOptions();

      if (selectedValues.length === 0) return placeholder;
      if (!multiSelect) return selectedOptions[0]?.label || placeholder;

      if (renderDisplay) return renderDisplay(selectedOptions);
      if (formatMultipleDisplay) return formatMultipleDisplay(selectedOptions);
      if (displayAllValues && selectedOptions.length > 0) {
        return selectedOptions.map((opt) => opt.label).join(", ");
      }

      return selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} items selected`;
    }, [
      selectedValues,
      multiSelect,
      placeholder,
      renderDisplay,
      formatMultipleDisplay,
      getSelectedOptions,
      displayAllValues,
    ]);

    const baseButtonClassName = `
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
  `.trim();

    return (
      <div
        ref={mergeRefs(ref, containerRef)}
        className={`relative ${className}`}
        role="combobox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        {...rest}
      >
        {required && (
          <input
            tabIndex={-1}
            value={selectedValues.join(",")}
            onChange={() => {}}
            required
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
            onFocus={() => buttonRef.current?.focus()}
          />
        )}
        <div
          ref={buttonRef}
          className={baseButtonClassName}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-controls={id ? `${id}-listbox` : undefined}
          id={id}
          data-testid="selector-button"
        >
          <span className="truncate">{getDisplayText()}</span>
          <svg
            className={`h-5 w-5 pointer-events-none transform transition-transform duration-200 ${
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
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto"
            style={{ minWidth: `${buttonWidth}px` }}
            role="listbox"
            id={id ? `${id}-listbox` : undefined}
            aria-multiselectable={multiSelect}
            data-testid="selector-options"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={(el: HTMLDivElement | null) => {
                  optionsRef.current[index] = el;
                }}
                className={`
                p-2 flex items-center
                ${
                  option.disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-blue-100 cursor-pointer"
                }
                ${focusedIndex === index ? "bg-blue-50" : ""}
              `.trim()}
                onClick={() => handleOptionClick(option.value, option.disabled)}
                role="option"
                aria-selected={selectedValues.includes(option.value)}
                tabIndex={option.disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOptionClick(option.value, option.disabled);
                  }
                }}
                data-testid={`selector-option-${option.value}`}
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
                  className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={selectAll}
                  type="button"
                  data-testid="selector-select-all"
                >
                  Select All
                </button>
                <button
                  className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={clearAll}
                  type="button"
                  data-testid="selector-clear-all"
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

const mergeRefs = <T,>(
  ...refs: (React.MutableRefObject<T> | React.LegacyRef<T> | undefined)[]
): React.RefCallback<T> => {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
};

Selector.displayName = "Selector";

export default Selector;
