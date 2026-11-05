import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
      <p className="text-muted">
        You&apos;re signed in as an admin. Pick a section in the sidebar. New
        here? Read the{" "}
        <Link href="/help" className="text-foreground underline">
          Help page
        </Link>{" "}
        first: it explains what each section changes on the site and the rules
        each form checks.
      </p>
    </div>
  );
}
