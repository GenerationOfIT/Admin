import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = { title: "Sign in | GenofIT Admin" };

export default async function LoginPage() {
  if (await getAdminClient()) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="bg-surface border-border w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-1 text-2xl font-bold">GenofIT Admin</h1>
        <p className="text-muted mb-6 text-sm">
          Sign in with your admin account.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
