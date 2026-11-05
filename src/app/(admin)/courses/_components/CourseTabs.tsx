"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { StableLabel } from "@/components/ui/StableLabel";

// One URL per tab, each with its own Save. Content tabs follow the order of
// the course page's own tabs.
const tabs = [
  { path: "", label: "Basics" },
  { path: "/lecturers", label: "Lecturers" },
  { path: "/overview", label: "Overview" },
  { path: "/curriculum", label: "Curriculum" },
  { path: "/capstone", label: "Capstone" },
  { path: "/outcomes", label: "Outcomes" },
  { path: "/stats", label: "Stats" },
  { path: "/pricing", label: "Schedule & pricing" },
  { path: "/seo", label: "Search results" },
];

export function CourseTabs({ id }: { id: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Course sections"
      className="mb-8 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)]"
    >
      {tabs.map((tab) => {
        const href = `/courses/${id}${tab.path}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.path}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm",
              active
                ? "border-accent font-bold"
                : "text-muted hover:text-foreground border-transparent",
            )}
          >
            <StableLabel>{tab.label}</StableLabel>
          </Link>
        );
      })}
    </nav>
  );
}
