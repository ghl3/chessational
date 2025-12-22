"use client";

import React, { useState, useCallback } from "react";
import { Button } from "./Button";
import { GameReviewConfig } from "@/hooks/UseGameReviewState";

interface GamesConfigProps {
  onSubmit: (config: GameReviewConfig) => void;
  isLoading: boolean;
  initialConfig?: Partial<GameReviewConfig>;
}

const TIME_CLASS_OPTIONS = [
  { value: "bullet", label: "Bullet" },
  { value: "blitz", label: "Blitz" },
  { value: "rapid", label: "Rapid" },
  { value: "daily", label: "Daily" },
];

/**
 * Format date to YYYY-MM-DD for input[type="date"]
 */
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Get default start date (3 months ago)
 */
const getDefaultStartDate = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date;
};

/**
 * Configuration form for fetching Chess.com games
 */
export const GamesConfig: React.FC<GamesConfigProps> = ({
  onSubmit,
  isLoading,
  initialConfig,
}) => {
  const [username, setUsername] = useState(initialConfig?.username || "");
  const [startDate, setStartDate] = useState(
    formatDateForInput(initialConfig?.startDate || getDefaultStartDate())
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(initialConfig?.endDate || new Date())
  );
  const [timeClasses, setTimeClasses] = useState<string[]>(
    initialConfig?.timeClasses || []
  );

  const handleTimeClassToggle = useCallback((timeClass: string) => {
    setTimeClasses((prev) =>
      prev.includes(timeClass)
        ? prev.filter((tc) => tc !== timeClass)
        : [...prev, timeClass]
    );
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Form submitted, username:", username);

      if (!username.trim()) {
        console.log("Username is empty, returning");
        return;
      }

      const config = {
        username: username.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timeClasses,
      };
      console.log("Calling onSubmit with config:", config);
      onSubmit(config);
    },
    [username, startDate, endDate, timeClasses, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Chess.com Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            From
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            To
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Time classes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Time Controls (leave empty for all)
        </label>
        <div className="flex flex-wrap gap-2">
          {TIME_CLASS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTimeClassToggle(value)}
              disabled={isLoading}
              className={`
                px-3 py-1.5 text-sm rounded-full transition-colors
                ${
                  timeClasses.includes(value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        label={isLoading ? "Loading..." : "Load Games"}
        variant="primary"
        size="large"
        disabled={isLoading || !username.trim()}
        loading={isLoading}
        className="w-full"
      />
    </form>
  );
};

export default GamesConfig;

