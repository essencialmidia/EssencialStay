import type { LucideIcon } from "lucide-react";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "highlight";
  trend?: string;
  valueClassName?: string;
};

const toneVariant = {
  default: "muted",
  success: "success",
  warning: "warning",
  highlight: "highlight",
} as const;

const iconTone = {
  default: "bg-secondary text-muted-foreground",
  success: "bg-success/[0.12] text-success",
  warning: "bg-warning/[0.14] text-warning",
  highlight: "bg-highlight/[0.14] text-highlight-foreground dark:text-highlight",
};

export function StatCard({ title, value, detail, icon: Icon, tone = "default", trend, valueClassName }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`grid size-9 shrink-0 place-items-center rounded-md ${iconTone[tone]}`}>
            <Icon className="size-[18px]" aria-hidden="true" />
          </div>
        </div>
        <p className={`tabular-nums mt-3 text-[28px] font-semibold leading-none ${valueClassName ?? ""}`}>{value}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Badge variant={toneVariant[tone]}>{detail}</Badge>
          {trend && <span className="text-xs text-muted-foreground">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
