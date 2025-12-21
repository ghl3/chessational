"use client";

import { NavBar } from "./NavBar";

const Title = () => {
  return (
    <div className="bg-gray-800 text-white py-3 px-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold">Chessational</h1>
        <NavBar />
      </div>
    </div>
  );
};
export default Title;
