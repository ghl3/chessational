import { Dispatch, SetStateAction } from "react";

export type Tab = "REVIEW" | "STUDIES" | "LINES" | "ATTEMPTS" | "TREE";

const NavEntry: React.FC<{
  name: string;
  tab: Tab;
  currentMode: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
}> = ({ name, tab, setTab, currentMode }) => {
  const active = tab === currentMode;
  return (
    <li className={active ? "border-b-2 border-blue-500" : ""}>
      <button
        key={name}
        onClick={() => setTab(tab)}
        className="hover:text-blue-300 transition duration-300"
        aria-label={`Switch to ${name} tab`}
        aria-selected={active}
        role="tab"
      >
        {name}
      </button>
    </li>
  );
};

export const NavBar: React.FC<{
  mode: Tab;
  setMode: Dispatch<SetStateAction<Tab>>;
}> = ({ mode, setMode }) => {
  return (
    <nav className="flex flex-row bg-gray-800 text-white p-4 justify-center" role="navigation" aria-label="Main navigation">
      <ul className="flex space-x-4" role="tablist">
        <NavEntry
          name="Review"
          tab="REVIEW"
          currentMode={mode}
          setTab={setMode}
        />
        <NavEntry
          name="Studies"
          tab="STUDIES"
          currentMode={mode}
          setTab={setMode}
        />
        <NavEntry
          name="Lines"
          tab="LINES"
          currentMode={mode}
          setTab={setMode}
        />
        <NavEntry
          name="Attempts"
          tab="ATTEMPTS"
          currentMode={mode}
          setTab={setMode}
        />
        <NavEntry
          name="Tree"
          tab="TREE"
          currentMode={mode}
          setTab={setMode}
        />
      </ul>
    </nav>
  );
};
