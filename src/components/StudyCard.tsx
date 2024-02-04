import React from "react";

interface StudyCardProps {
  name: string;
  onRefresh: (studyName: string) => void;
  onDelete: (studyName: string) => void;
}

const StudyCard: React.FC<StudyCardProps> = ({ name, onRefresh, onDelete }) => {
  return (
    <div className="max-w-md bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex-grow mr-4">
          {name}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onRefresh(name)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300"
          >
            Refresh
          </button>
          <button
            onClick={() => onDelete(name)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
