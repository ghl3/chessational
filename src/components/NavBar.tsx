"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = "REPERTOIRE" | "PRACTICE" | "GAMES";

// Map tabs to their URL paths
const TAB_PATHS: Record<Tab, string> = {
  REPERTOIRE: "/repertoire",
  PRACTICE: "/practice",
  GAMES: "/games",
};

// Map paths to tabs for reverse lookup
const PATH_TO_TAB: Record<string, Tab> = {
  "/": "PRACTICE", // Root redirects to practice
  "/repertoire": "REPERTOIRE",
  "/practice": "PRACTICE",
  "/games": "GAMES",
};

const NavEntry: React.FC<{
  name: string;
  href: string;
  isActive: boolean;
}> = ({ name, href, isActive }) => {
  return (
    <li>
      <Link
        href={href}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors duration-200
          ${isActive 
            ? "bg-blue-600/80 text-white" 
            : "text-gray-300 hover:text-white hover:bg-gray-700"
          }
        `}
        aria-label={`Switch to ${name} tab`}
        aria-selected={isActive}
        role="tab"
      >
        {name}
      </Link>
    </li>
  );
};

export const NavBar: React.FC = () => {
  const pathname = usePathname();
  const currentTab = PATH_TO_TAB[pathname] || "PRACTICE";

  return (
    <nav
      className="flex flex-row text-white justify-center"
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="flex space-x-2" role="tablist">
        <NavEntry
          name="Repertoire"
          href={TAB_PATHS.REPERTOIRE}
          isActive={currentTab === "REPERTOIRE"}
        />
        <NavEntry
          name="Practice"
          href={TAB_PATHS.PRACTICE}
          isActive={currentTab === "PRACTICE"}
        />
        <NavEntry
          name="Games"
          href={TAB_PATHS.GAMES}
          isActive={currentTab === "GAMES"}
        />
      </ul>
    </nav>
  );
};
