import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * A table cell whose whole area, padding included, is a link, so a click
 * anywhere on the row opens it. h-px on the cell lets the link fill the row's
 * height. Only the first cell is a tab stop and read by screen readers; the
 * others repeat the same link for the mouse.
 */
export function LinkCell({
  href,
  first = false,
  className,
  children,
}: {
  href: string;
  first?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td className="h-px p-0">
      <Link
        href={href}
        tabIndex={first ? undefined : -1}
        aria-hidden={first ? undefined : true}
        className={cn("flex h-full items-center px-4 py-3", className)}
      >
        {children}
      </Link>
    </td>
  );
}
