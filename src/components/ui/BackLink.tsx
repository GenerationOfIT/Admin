import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** The "back to the list" link above an edit page's title. */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {children}
    </Link>
  );
}
