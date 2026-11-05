"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { StableLabel } from "@/components/ui/StableLabel";

// One URL per tab, each with its own Save, in the order of the event page.
const tabs = [
  { path: "", label: "Basics" },
  { path: "/schedule", label: "Schedule" },
  { path: "/highlights", label: "Highlights" },
  { path: "/agenda", label: "Agenda" },
  { path: "/speakers", label: "Speakers" },
];

export function EventTabs({ id }: { id: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Event sections"
      className="mb-8 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)]"
    >
      {tabs.map((tab) => {
        const href = `/events/${id}${tab.path}`;
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
