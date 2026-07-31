import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Breadcrumb } from "../ui/breadcrumb";

type PageHeaderProps = {
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
};

export function PageHeader({ title, description, badge, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="min-w-0 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Breadcrumb items={breadcrumb ?? ["Essencial Stay", title]} />
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 break-words text-balance text-2xl font-semibold leading-tight sm:text-[28px]">{title}</h1>
            {badge && <Badge variant="highlight">{badge}</Badge>}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 [&>button]:w-full sm:w-auto sm:shrink-0 sm:[&>button]:w-auto">{actions}</div>}
    </div>
  );
}
