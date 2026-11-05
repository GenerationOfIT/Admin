"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

const field =
  "border-border bg-background rounded-lg border px-3 py-2 text-base outline-none focus:border-primary";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-ink mt-2 rounded-full px-5 py-2.5 font-bold"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
