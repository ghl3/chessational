import React from "react";

interface DeleteConfirmationProps {
  onConfirmDeleteYes: () => void;
  onConfirmDeleteNo: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  onConfirmDeleteYes,
  onConfirmDeleteNo,
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-sm p-4">
        <h2 className="text-lg font-bold mb-4 text-black">Confirm Delete</h2>
        <button
          className="bg-blue-500 text-white rounded-sm px-4 py-2 mr-2"
          onClick={onConfirmDeleteYes}
        >
          Yes
        </button>
        <button
          className="bg-gray-300 text-black rounded-sm px-4 py-2"
          onClick={onConfirmDeleteNo}
        >
          No
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
