import { Dispatch, SetStateAction } from "react";

export type Mode =
  | "REVIEW"
  | "EXPLORE"
  | "SEARCH"
  | "STATS"
  | "STUDIES"
  | "TREE";

const NavEntry: React.FC<{
  name: string;
  mode: Mode;
  currentMode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
}> = ({ name, mode, setMode, currentMode }) => {
  const active = mode === currentMode;
  return (
    <li className={active ? "border-b-2 border-blue-500" : ""}>
      <button
        key={name}
        onClick={() => setMode(mode)}
        className="hover:text-blue-300 transition duration-300"
      >
        {name}
      </button>
    </li>
  );
};

export const NavBar: React.FC<{
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
}> = ({ mode, setMode }) => {
  return (
    <div>
      <nav className="flex flex-row bg-gray-800 text-white p-4 space-x-4">
        <ul className="flex justify-center space-x-4">
          <NavEntry
            name="Studies"
            mode="STUDIES"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Review"
            mode="REVIEW"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Explore"
            mode="EXPLORE"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Search"
            mode="SEARCH"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Stats"
            mode="STATS"
            currentMode={mode}
            setMode={setMode}
          />
          <NavEntry
            name="Tree"
            mode="TREE"
            currentMode={mode}
            setMode={setMode}
          />
        </ul>
      </nav>
    </div>
  );
};
