/**
 * Text that always takes the width of its bold version, so a tab or filter
 * doesn't grow when it becomes the active (bold) one and nudge its
 * neighbours. A hidden bold copy sits under the visible text in one grid cell.
 */
export function StableLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-grid">
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 font-bold"
      >
        {children}
      </span>
      <span className="col-start-1 row-start-1">{children}</span>
    </span>
  );
}
