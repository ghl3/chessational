"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex justify-center space-x-4">
        <li className={pathname === "/" ? "border-b-2 border-blue-500" : ""}>
          <Link
            href="/"
            className="hover:text-blue-300 transition duration-300"
          >
            Home
          </Link>
        </li>
        <li
          className={pathname === "/stats" ? "border-b-2 border-blue-500" : ""}
        >
          <Link
            href="/stats"
            className="hover:text-blue-300 transition duration-300"
          >
            Stats
          </Link>
        </li>
        <li
          className={pathname === "/tree" ? "border-b-2 border-blue-500" : ""}
        >
          <Link
            href="/tree"
            className="hover:text-blue-300 transition duration-300"
          >
            Tree
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
