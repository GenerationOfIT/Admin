import { PageSkeleton } from "@/components/ui/PageSkeleton";

// The admin-wide loading.tsx only shows when switching sections; this one
// also covers moving within the section, e.g. from the list to an item.
export default function Loading() {
  return <PageSkeleton />;
}
