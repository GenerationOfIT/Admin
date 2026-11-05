import { get, type FieldErrors } from "react-hook-form";

/** The error message at a dotted form path, e.g. "cards.2.title". */
export function errorAt(errors: FieldErrors, path: string): string | undefined {
  const error = get(errors, path) as
    ({ message?: string } & { value?: { message?: string } }[]) | undefined;
  // A list of { value } items reports its first item error, if any.
  return (
    error?.message ??
    (Array.isArray(error)
      ? error.find((item) => item?.value?.message)?.value?.message
      : undefined)
  );
}
