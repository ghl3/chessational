import { Loader2 } from "lucide-react";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  active?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  small: "px-3 py-1.5 text-sm gap-1.5",
  medium: "px-4 py-2 text-base gap-2",
  large: "px-5 py-2.5 text-lg gap-2",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 ring-blue-500/50",
  secondary:
    "bg-gray-600 text-white hover:bg-gray-500 active:bg-gray-400 ring-gray-500/50",
  ghost:
    "text-gray-300 hover:bg-gray-700 active:bg-gray-600 ring-gray-500/50",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 ring-red-500/50",
};

const baseClasses = `
  inline-flex items-center justify-center
  font-medium rounded-lg
  transition-colors duration-200
  focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
  disabled:opacity-50 disabled:pointer-events-none
  select-none
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      label,
      size = "medium",
      variant = "primary",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      active = false,
      className = "",
      onClick,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      onClick?.(event);
    };

    const computedDisabled = disabled || loading;

    const renderIcon = () => {
      if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
      }
      return icon;
    };

    const content = (
      <>
        {(icon || loading) && iconPosition === "left" && renderIcon()}
        <span>{label}</span>
        {(icon || loading) && iconPosition === "right" && renderIcon()}
      </>
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={computedDisabled}
        aria-disabled={computedDisabled}
        aria-busy={loading}
        onClick={handleClick}
        className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${active ? "ring-2" : ""}
        ${className}
      `.trim()}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
