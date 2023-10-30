interface ControlButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled,
  label,
}) => {
  return (
    <button
      className={`px-4 py-2 text-lg rounded ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : `bg-blue-500 text-white active:bg-blue-700`
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
