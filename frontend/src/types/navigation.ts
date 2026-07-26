import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  soon?: boolean;
  description: string;
};
