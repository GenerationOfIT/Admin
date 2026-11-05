import { PageSkeleton } from "@/components/ui/PageSkeleton";

// Switching tabs keeps the course title and tabs; only the tab's form waits.
export default function Loading() {
  return <PageSkeleton title={false} />;
}
