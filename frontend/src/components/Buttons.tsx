import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary" | "light";
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </a>
  );
}

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean;
  isSuccess?: boolean;
  label: string;
};

export function SubmitButton({
  isSubmitting = false,
  isSuccess = false,
  label,
  ...props
}: SubmitButtonProps) {
  const text = isSuccess ? "Submitted" : isSubmitting ? "Submitting..." : label;

  return (
    <button
      className="submit-button"
      disabled={isSubmitting || isSuccess}
      type="submit"
      {...props}
    >
      {text}
    </button>
  );
}
