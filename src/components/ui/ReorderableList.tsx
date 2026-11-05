"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export type ReorderRow = {
  id: string;
  /** Names the row in the arrows' labels, e.g. "Move Manual Testing up". */
  label: string;
  /** The row's own content, rendered on the server. */
  content: React.ReactNode;
};

/**
 * A list whose order is edited in one go: "Edit order" shows arrows that
 * move rows on screen only, and "Save order" sends the whole order once.
 * Nothing looks saved before it is, and moving a row far doesn't wait for a
 * save per step.
 */
export function ReorderableList({
  rows,
  save,
  numbered = false,
}: {
  rows: ReorderRow[];
  save: (ids: string[]) => Promise<{ error: string } | undefined>;
  /** Shows each row's position, e.g. for the testimonial order page. */
  numbered?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const byId = new Map(rows.map((row) => [row.id, row]));
  const shown = editing ? order.flatMap((id) => byId.get(id) ?? []) : rows;
  const changed = order.some((id, index) => id !== rows[index]?.id);

  const move = (index: number, to: number) =>
    setOrder((current) => {
      const next = [...current];
      [next[index], next[to]] = [next[to]!, next[index]!];
      return next;
    });

  const List = numbered ? "ol" : "ul";

  return (
    <div>
      <div className="mb-3 flex min-h-8 flex-wrap items-center justify-end gap-3">
        {editing ? (
          <>
            <span className="text-muted mr-auto text-sm">
              Move rows with the arrows, then save.
            </span>
            {error && (
              <span role="alert" className="text-danger text-sm">
                {error}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!changed || pending}
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  const result = await save(order);
                  if (result) setError(result.error);
                  // The transition ends once the saved order has rendered.
                  else setEditing(false);
                })
              }
            >
              {pending ? "Saving..." : "Save order"}
            </Button>
          </>
        ) : (
          rows.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOrder(rows.map((row) => row.id));
                setEditing(true);
              }}
            >
              Edit order
            </Button>
          )
        )}
      </div>
      <List
        className={cn(
          "border-border divide-border divide-y rounded-xl border",
          editing && "border-accent",
        )}
      >
        {shown.map((row, index) => (
          <li key={row.id} className="flex items-center gap-4 px-4 py-3">
            {numbered && (
              <span className="text-muted w-6 text-right text-sm">
                {index + 1}
              </span>
            )}
            {editing && (
              <div className="flex flex-col">
                {(["up", "down"] as const).map((direction) => {
                  const to = direction === "up" ? index - 1 : index + 1;
                  return (
                    <button
                      key={direction}
                      type="button"
                      disabled={pending || to < 0 || to >= shown.length}
                      aria-label={`Move ${row.label} ${direction}`}
                      onClick={() => move(index, to)}
                      className="text-muted hover:text-foreground cursor-pointer disabled:cursor-default disabled:opacity-30"
                    >
                      {direction === "up" ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {row.content}
          </li>
        ))}
      </List>
    </div>
  );
}
