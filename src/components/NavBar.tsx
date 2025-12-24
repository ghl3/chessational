"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = "STUDIES" | "PRACTICE" | "GAMES" | "ABOUT";

// Map tabs to their URL paths
const TAB_PATHS: Record<Tab, string> = {
  STUDIES: "/studies",
  PRACTICE: "/practice",
  GAMES: "/games",
  ABOUT: "/about",
};

// Map paths to tabs for reverse lookup
const PATH_TO_TAB: Record<string, Tab> = {
  "/": "PRACTICE", // Root redirects to practice
  "/studies": "STUDIES",
  "/practice": "PRACTICE",
  "/games": "GAMES",
  "/about": "ABOUT",
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
          name="Studies"
          href={TAB_PATHS.STUDIES}
          isActive={currentTab === "STUDIES"}
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
        <NavEntry
          name="About"
          href={TAB_PATHS.ABOUT}
          isActive={currentTab === "ABOUT"}
        />
      </ul>
    </nav>
  );
};
