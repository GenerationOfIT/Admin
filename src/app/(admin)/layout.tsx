import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signOut } from "../login/actions";

// Grouped by the kind of work. Sections appear here as they are built (see
// PLAN.md, "Build order").
const groups = [
  {
    label: null,
    sections: [
      { href: "/", label: "Dashboard" },
      { href: "/help", label: "Help" },
    ],
  },
  {
    label: "Website content",
    sections: [
      { href: "/courses", label: "Courses" },
      { href: "/services", label: "Services" },
      { href: "/events", label: "Events" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/team", label: "Team" },
      { href: "/partners", label: "Partners" },
      { href: "/graduates", label: "Graduates" },
    ],
  },
  {
    label: "Orders",
    sections: [
      { href: "/orders", label: "Orders" },
      { href: "/emails", label: "Emails" },
    ],
  },
  {
    label: "Media",
    sections: [{ href: "/media", label: "Images" }],
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen">
      {/* Fixed to the window height, so Sign out stays in view on long pages. */}
      <aside className="bg-surface border-border sticky top-0 flex h-dvh w-56 shrink-0 flex-col self-start border-r p-4">
        <p className="mb-6 px-2 text-lg font-bold">GenofIT Admin</p>
        <nav
          aria-label="Admin sections"
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
        >
          {groups.map((group) => (
            <div key={group.label ?? "general"} className="flex flex-col gap-1">
              {group.label && (
                <p className="text-muted mb-1 px-2 text-xs font-bold tracking-widest uppercase">
                  {group.label}
                </p>
              )}
              {group.sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="hover:bg-background rounded-lg px-2 py-1.5"
                >
                  {section.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <form action={signOut} className="border-border border-t pt-4">
          <SubmitButton
            variant="secondary"
            size="sm"
            className="w-full"
            pendingLabel="Signing out..."
          >
            Sign out
          </SubmitButton>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-8 wrap-break-word">{children}</main>
    </div>
  );
}
