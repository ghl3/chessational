"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = "REVIEW" | "STUDIES" | "LINES" | "ATTEMPTS" | "TREE";

// Map tabs to their URL paths
const TAB_PATHS: Record<Tab, string> = {
  REVIEW: "/",
  STUDIES: "/studies",
  LINES: "/lines",
  ATTEMPTS: "/attempts",
  TREE: "/tree",
};

// Map paths to tabs for reverse lookup
const PATH_TO_TAB: Record<string, Tab> = {
  "/": "REVIEW",
  "/studies": "STUDIES",
  "/lines": "LINES",
  "/attempts": "ATTEMPTS",
  "/tree": "TREE",
};

const NavEntry: React.FC<{
  name: string;
  href: string;
  isActive: boolean;
}> = ({ name, href, isActive }) => {
  return (
    <li className={isActive ? "border-b-2 border-blue-500" : ""}>
      <Link
        href={href}
        className="hover:text-blue-300 transition duration-300"
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
  const currentTab = PATH_TO_TAB[pathname] || "REVIEW";

  return (
    <nav
      className="flex flex-row bg-gray-800 text-white p-4 justify-center"
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="flex space-x-4" role="tablist">
        <NavEntry
          name="Review"
          href={TAB_PATHS.REVIEW}
          isActive={currentTab === "REVIEW"}
        />
        <NavEntry
          name="Studies"
          href={TAB_PATHS.STUDIES}
          isActive={currentTab === "STUDIES"}
        />
        <NavEntry
          name="Lines"
          href={TAB_PATHS.LINES}
          isActive={currentTab === "LINES"}
        />
        <NavEntry
          name="Attempts"
          href={TAB_PATHS.ATTEMPTS}
          isActive={currentTab === "ATTEMPTS"}
        />
        <NavEntry
          name="Tree"
          href={TAB_PATHS.TREE}
          isActive={currentTab === "TREE"}
        />
      </ul>
    </nav>
  );
};
