import React, { useId } from "react";

type SwitchSize = "small" | "medium" | "large";
type LabelPosition = "left" | "right" | "top" | "bottom";
type SwitchVariant = "primary" | "success" | "danger" | "warning";

export interface SwitchButtonProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange"
  > {
  onChange: (checked: boolean) => void;
  checked: boolean;
  label: string;
  labelPosition?: LabelPosition;
  size?: SwitchSize;
  variant?: SwitchVariant;
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

const switchSizeConfig: Record<
  SwitchSize,
  {
    switch: string;
    dot: string;
    label: string;
    container: string;
    translate: string;
    dotOffset: string;
  }
> = {
  small: {
    switch: "w-7 h-4",
    dot: "w-3 h-3",
    label: "text-xs",
    container: "gap-1",
    translate: "translate-x-3",
    dotOffset: "left-0.5 top-0.5",
  },
  medium: {
    switch: "w-9 h-5",
    dot: "w-4 h-4",
    label: "text-sm",
    container: "gap-1.5",
    translate: "translate-x-4",
    dotOffset: "left-0.5 top-0.5",
  },
  large: {
    switch: "w-11 h-6",
    dot: "w-5 h-5",
    label: "text-base",
    container: "gap-2",
    translate: "translate-x-5",
    dotOffset: "left-0.5 top-0.5",
  },
};

const variantClasses: Record<
  SwitchVariant,
  {
    active: string;
    inactive: string;
    dot: string;
  }
> = {
  primary: {
    active: "bg-blue-600",
    inactive: "bg-gray-600",
    dot: "bg-white",
  },
  success: {
    active: "bg-emerald-600",
    inactive: "bg-gray-600",
    dot: "bg-white",
  },
  danger: {
    active: "bg-rose-600",
    inactive: "bg-gray-600",
    dot: "bg-white",
  },
  warning: {
    active: "bg-amber-500",
    inactive: "bg-gray-600",
    dot: "bg-white",
  },
};

export const SwitchButton = React.forwardRef<
  HTMLInputElement,
  SwitchButtonProps
>(
  (
    {
      onChange,
      checked,
      label,
      labelPosition = "left",
      size = "medium",
      variant = "primary",
      description,
      icon,
      loading = false,
      error = false,
      disabled = false,
      className = "",
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const uniqueId = useId();
    const id = providedId || uniqueId;
    const {
      switch: switchSize,
      dot: dotSize,
      label: labelSize,
      container: containerGap,
      translate,
      dotOffset,
    } = switchSizeConfig[size];
    const { active, inactive, dot: dotColor } = variantClasses[variant];

    const handleClick = () => {
      if (!disabled && !loading) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleClick();
      }
    };

    const containerClasses = {
      left: "flex-row",
      right: "flex-row-reverse",
      top: "flex-col",
      bottom: "flex-col-reverse",
    };

    const renderSwitch = () => (
      <div
        className="relative"
        onClick={handleClick}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        <input
          {...props}
          id={id}
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={() => {}} // Handling through div click
          disabled={disabled || loading}
          className="sr-only"
          aria-label={label}
        />

        <div
          className={`
          block rounded-full transition-colors duration-200
          ${switchSize}
          ${checked ? active : inactive}
          ${error ? "ring-2 ring-rose-500" : ""}
          ${disabled ? "opacity-50" : ""}
          ${!disabled ? "cursor-pointer" : ""}
        `.trim()}
        />

        <div
          className={`
          absolute ${dotOffset}
          rounded-full transition-transform duration-200
          ${dotSize}
          ${dotColor}
          ${disabled ? "opacity-50" : ""}
          ${checked ? translate : "translate-x-0"}
        `.trim()}
        >
          {loading && (
            <svg
              className="animate-spin h-full w-full text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
      </div>
    );

    const renderLabel = () => (
      <span
        className={`
        ${labelSize}
        ${disabled ? "text-gray-400" : "text-white"}
        ${error ? "text-rose-500" : ""}
        ${!disabled ? "cursor-pointer" : ""}
      `.trim()}
        onClick={handleClick}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {label}
        {description && (
          <span className="text-xs text-gray-400 ml-1">{description}</span>
        )}
      </span>
    );

    return (
      <div
        className={`
        inline-flex ${containerClasses[labelPosition]} ${containerGap}
        items-center select-none
        ${disabled ? "cursor-not-allowed" : ""}
        ${className}
      `.trim()}
      >
        {renderLabel()}
        {renderSwitch()}
      </div>
    );
  },
);

SwitchButton.displayName = "SwitchButton";

export default SwitchButton;
