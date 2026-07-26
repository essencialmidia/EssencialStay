import type { ReactNode } from "react";
import { BrandMark } from "../navigation/brand-mark";
import { ThemeSelector } from "../navigation/theme-selector";

export function AuthLayout({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <BrandMark />
          <ThemeSelector />
        </header>
        <section className="grid flex-1 place-items-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="rounded-lg border bg-card p-5 shadow-sm">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
