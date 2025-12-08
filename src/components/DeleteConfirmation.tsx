import React from "react";
import { Button } from "./Button";

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
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4 text-white">Confirm Delete</h2>
        <div className="flex gap-3">
          <Button
            label="Yes, Delete"
            variant="danger"
            size="medium"
            onClick={onConfirmDeleteYes}
          />
          <Button
            label="Cancel"
            variant="secondary"
            size="medium"
            onClick={onConfirmDeleteNo}
          />
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
