import React, { useEffect, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
}

interface CheckboxDropdownProps {
  text: string;
  options: Option[];
  selectedOptions: string[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
  defaultOn?: boolean;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  text,
  options,
  selectedOptions,
  setSelectedOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure that the dropdown is sized appropriately
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef]);

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        e.target !== buttonRef.current
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen((isOpen) => !isOpen);
  };

  const toggleOption = (optionValue: string) => {
    setSelectedOptions((prevSelectedOptions) =>
      prevSelectedOptions.includes(optionValue)
        ? prevSelectedOptions.filter((value) => value !== optionValue)
        : [...prevSelectedOptions, optionValue]
    );
  };

  const selectAll = () => {
    setSelectedOptions(options.map((option) => option.value));
  };

  const clearAll = () => {
    setSelectedOptions([]);
  };

  return (
    <div className="relative">
      <div
        ref={buttonRef}
        className="border rounded p-2 cursor-pointer flex justify-between items-center"
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
          className="absolute z-10 border border-gray-400 rounded p-2 bg-black"
        >
          {options.map((option) => (
            <div key={option.value}>
              <input
                type="checkbox"
                id={option.value}
                checked={selectedOptions.includes(option.value)}
                onChange={() => toggleOption(option.value)}
              />
              <label htmlFor={option.value}>{option.label}</label>
            </div>
          ))}
          <div className="flex justify-between mt-2">
            <button className="border rounded p-2" onClick={selectAll}>
              Select All
            </button>
            <button className="border rounded p-2" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckboxDropdown;
