import { Dispatch, SetStateAction } from "react";

export type Tab = "STUDIES" | "LINES" | "REVIEW" | "TREE";

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
    <div>
      <nav className="flex flex-row bg-gray-800 text-white p-4 space-x-4">
        <ul className="flex justify-center space-x-4">
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
            name="Review"
            tab="REVIEW"
            currentMode={mode}
            setTab={setMode}
          />
          {/*
          <NavEntry
            name="Tree"
            tab="TREE"
            currentMode={mode}
            setTab={setMode}
          />
          */}
        </ul>
      </nav>
    </div>
  );
};
