import { cn } from "../../lib/utils";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel, className }: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md bg-secondary p-1", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn("h-8 whitespace-nowrap rounded px-3 text-xs font-medium text-muted-foreground transition duration-fast ease-product focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", value === option.value && "bg-card text-foreground shadow-xs")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
