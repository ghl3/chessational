interface ControlButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  size: "small" | "medium" | "large";
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled,
  label,
  size = "large",
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case "small":
        return "px-2 py-1 text-sm";
      case "medium":
        return "px-3 py-1.5 text-md";
      case "large":
      default:
        return "px-4 py-2 text-lg";
    }
  };

  return (
    <button
      className={`${getSizeClasses(size)} rounded ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white active:bg-blue-700"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
