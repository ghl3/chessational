interface SwitchButtonProps {
  onChange: (checked: boolean) => void;
  checked: boolean;
  label: string;
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  onChange,
  checked,
  label,
}) => {
  return (
    <label className={"inline-flex items-center cursor-pointer"}>
      <span className="mr-2 text-white">{label}</span>{" "}
      <div className={`relative`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
        <div
          className={`dot absolute left-1 top-1  w-6 h-6 rounded-full transition ${
            checked ? "transform translate-x-full bg-blue-500" : "bg-gray-400"
          }`}
        ></div>
      </div>
    </label>
  );
};
