import React, { useCallback, useEffect, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
}

interface CheckboxDropdownProps {
  text: string;
  options: Option[];
  selectedOptions: string[];
  selectOption: (optionValue: string) => void;
  deselectOption: (optionValue: string) => void;
  defaultOn?: boolean;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  text,
  options,
  selectedOptions,
  selectOption,
  deselectOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure that the button and dropdown are sized appropriately
  const [buttonWidth, setButtonWidth] = useState(0);
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isClickOnButton =
        buttonRef.current &&
        (e.target === buttonRef.current ||
          buttonRef.current.contains(e.target as Node));

      const isClickOnDropdown =
        dropdownRef.current &&
        (e.target === buttonRef.current ||
          dropdownRef.current.contains(e.target as Node));

      if (!isClickOnButton && !isClickOnDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((isOpen) => !isOpen);
  }, []);

  const selectAll = () => {
    options.forEach((option) => selectOption(option.value));
  };

  const clearAll = () => {
    options.forEach((option) => deselectOption(option.value));
  };

  return (
    <div className="relative">
      <div
        ref={buttonRef}
        className="border rounded cursor-pointer flex justify-between items-center whitespace-nowrap hover:bg-gray-700"
        onClick={toggleDropdown}
      >
        <span>{text}</span>
        <svg
          className="h-5 w-5 pointer-events-none"
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
          ref={dropdownRef}
          style={{ minWidth: `${buttonWidth}px` }}
          className="absolute z-10 border border-gray-400 rounded p-2 bg-black w-auto"
        >
          {options.map((option) => (
            <div
              key={option.value}
              className="whitespace-nowrap hover:bg-gray-700 p-1 rounded"
            >
              <input
                type="checkbox"
                id={option.value}
                className="mr-2"
                checked={selectedOptions.includes(option.value)}
                onChange={() => {
                  if (selectedOptions.includes(option.value)) {
                    deselectOption(option.value);
                  } else {
                    selectOption(option.value);
                  }
                }}
              />
              <label htmlFor={option.value} className="cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
          <div className="flex justify-between mt-2">
            <button
              className="border rounded p-2 hover:bg-gray-700"
              onClick={selectAll}
            >
              Select All
            </button>
            <button
              className="border rounded p-2 hover:bg-gray-700"
              onClick={clearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckboxDropdown;
