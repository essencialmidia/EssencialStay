import { useState } from "react";
import { cn } from "../../lib/utils";

type HotelMonacoLogoProps = {
  className?: string;
  compact?: boolean;
};

export function HotelMonacoLogo({ className, compact = false }: HotelMonacoLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={cn("text-sm font-semibold tracking-wide text-white", className)}>Hotel Mônaco</span>;
  }

  return (
    <div className={cn("overflow-hidden rounded-md bg-[#b9b9b9] shadow-xs", compact ? "h-10 w-24" : "h-16 w-40", className)}>
      <img
        src="/brands/hotel-monaco/logo-hotel-monaco.png"
        alt="Hotel Mônaco"
        className="size-full object-cover"
        style={{ objectPosition: "50% 48%" }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
