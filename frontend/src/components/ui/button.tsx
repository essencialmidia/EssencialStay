import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive" | "accent";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border border-primary bg-primary text-primary-foreground shadow-xs hover:-translate-y-px hover:bg-primary/90 hover:shadow-soft active:translate-y-0",
  secondary: "border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/75",
  ghost: "border border-transparent text-foreground hover:bg-secondary",
  outline: "border bg-background text-foreground shadow-xs hover:border-input hover:bg-secondary/65",
  destructive: "border border-destructive bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
  accent: "border border-accent bg-accent text-accent-foreground shadow-xs hover:-translate-y-px hover:bg-accent/90 hover:shadow-soft active:translate-y-0",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2.5 px-5 text-sm",
  icon: "size-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition duration-fast ease-product focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
