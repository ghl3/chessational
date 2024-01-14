interface SwitchButtonProps {
  onChange: (checked: boolean) => void;
  checked: boolean;
  label: string;
  labelPosition?: "left" | "top";
  size: "small" | "medium" | "large";
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  onChange,
  checked,
  label,
  labelPosition = "left",
  size = "medium",
}) => {
  const switchSizeClasses = {
    small: "w-8 h-4",
    medium: "w-10 h-6",
    large: "w-14 h-8",
  };

  const dotSizeClasses = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-6 h-6",
  };

  const labelSizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-lg",
  };

  const labelClasses =
    labelPosition === "top"
      ? `flex flex-col items-center cursor-pointer mb-2 ${labelSizeClasses[size]}`
      : `inline-flex items-center cursor-pointer mr-2 ${labelSizeClasses[size]}`;

  return (
    <label className={labelClasses}>
      <span>{label}</span>
      <div className={`relative`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <div
          className={`block rounded-full transition ${
            switchSizeClasses[size]
          } ${checked ? "bg-blue-500" : "bg-gray-600"}`}
        ></div>
        <div
          className={`dot absolute left-1 top-1 rounded-full transition ${
            dotSizeClasses[size]
          } ${
            checked ? "transform translate-x-full bg-gray-400" : "bg-gray-400"
          }`}
        ></div>
      </div>
    </label>
  );
};
