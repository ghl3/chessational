interface SwitchButtonProps {
  onChange: (checked: boolean) => void;
  checked: boolean;
  label: string;
  labelPosition?: "left" | "top"; // Optional with default value 'left'
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  onChange,
  checked,
  label,
  labelPosition = "left",
}) => {
  const labelClasses =
    labelPosition === "top"
      ? "flex flex-col items-center cursor-pointer mb-2"
      : "inline-flex items-center cursor-pointer mr-2";

  return (
    <label className={labelClasses}>
      <span className="text-white">{label}</span>
      <div className={`relative`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <div
          className={`block w-14 h-8 rounded-full transition ${
            checked ? "bg-blue-400" : "bg-gray-600" // Changed to a brighter shade of blue
          }`}
        ></div>
        <div
          className={`dot absolute left-1 top-1 w-6 h-6 rounded-full transition ${
            checked ? "transform translate-x-full bg-blue-500" : "bg-gray-400"
          }`}
        ></div>
      </div>
    </label>
  );
};
