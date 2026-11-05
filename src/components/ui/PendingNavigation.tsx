"use client";

import { createContext, useContext, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "./PageSkeleton";

/*
 * Filters, tabs and paging that only change the query string stay on the same
 * route, so loading.tsx doesn't show. These navigate in a transition instead,
 * and PendingContent swaps in a skeleton until the new page has rendered.
 */

const PendingContext = createContext<{
  pending: boolean;
  navigate: (href: string) => void;
} | null>(null);

function usePendingNavigation() {
  const context = useContext(PendingContext);
  if (!context) throw new Error("Use inside PendingNavigation.");
  return context;
}

export function PendingNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.push(href));
  return (
    <PendingContext value={{ pending, navigate }}>{children}</PendingContext>
  );
}

export function PendingLink({
  href,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = usePendingNavigation();
  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        // Cancelled elsewhere, e.g. by the unsaved-changes warning.
        if (event.defaultPrevented) return;
        // Leave ctrl/cmd/shift-click (new tab or window) to the browser.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}

/** A GET form (e.g. search) that navigates like PendingLink. */
export function PendingForm({
  action,
  ...props
}: Omit<React.ComponentProps<"form">, "action" | "onSubmit"> & {
  action: string;
}) {
  const { navigate } = usePendingNavigation();
  return (
    <form
      action={action}
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const query = new URLSearchParams();
        for (const [name, value] of new FormData(event.currentTarget))
          if (typeof value === "string" && value) query.set(name, value);
        navigate(`${action}?${query}`);
      }}
    />
  );
}

export function PendingContent({ children }: { children: React.ReactNode }) {
  const { pending } = usePendingNavigation();
  return pending ? <PageSkeleton title={false} /> : children;
}
