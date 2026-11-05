"use client";

import { Button } from "@/components/ui/Button";

// Shown when a page or form action throws, e.g. a database error.
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted mb-6">
        The change may not have been saved. Try again; if it keeps failing,
        check the browser console and the server logs.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
