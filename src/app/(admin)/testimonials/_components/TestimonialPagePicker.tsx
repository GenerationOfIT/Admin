"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { cn } from "@/lib/cn";

type Group = { label: string; pages: { key: string; label: string }[] };

/**
 * The page list beside the order table. Switching pages only changes the
 * query string, which doesn't trigger loading.tsx, so the navigation runs in
 * a transition here and the table shows a skeleton until the new rows arrive.
 */
export function TestimonialPagePicker({
  groups,
  current,
  children,
}: {
  groups: Group[];
  current: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState(current);
  const selected = pending ? target : current;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[14rem_minmax(0,1fr)]">
      <nav aria-label="Pages with testimonials" className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-muted mb-1 text-xs font-bold tracking-widest uppercase">
              {group.label}
            </p>
            <ul className="flex flex-col">
              {group.pages.map((option) => {
                const href = `/testimonials/order?page=${encodeURIComponent(option.key)}`;
                return (
                  <li key={option.key}>
                    <Link
                      href={href}
                      aria-current={option.key === current ? "page" : undefined}
                      onClick={(event) => {
                        if (event.defaultPrevented) return;
                        // Leave ctrl/cmd-click (new tab) to the browser.
                        if (event.metaKey || event.ctrlKey || event.shiftKey)
                          return;
                        event.preventDefault();
                        setTarget(option.key);
                        startTransition(() => router.push(href));
                      }}
                      className={cn(
                        "block rounded-lg px-2 py-1 text-sm",
                        option.key === selected
                          ? "bg-surface font-bold"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {pending ? <PageSkeleton title={false} /> : children}
    </div>
  );
}
