import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type SwitchProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean;
};

export function Switch({ checked = false, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "border-accent bg-accent" : "border-input bg-muted",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
