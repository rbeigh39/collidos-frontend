import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", isLoading = false, disabled, children, className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "Please wait…" : children}
    </button>
  );
});
