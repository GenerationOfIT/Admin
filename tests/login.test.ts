import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
};
const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth, rpc }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  },
}));
import { signIn } from "@/app/login/actions";

function form(email: string, password: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

beforeEach(() => {
  auth.signInWithPassword.mockReset();
  auth.signOut.mockReset();
  rpc.mockReset();
});

describe("Admin sign-in", () => {
  it("rejects empty fields without contacting Supabase", async () => {
    expect(await signIn(null, form(" ", ""))).toEqual({
      error: "Enter your email and password.",
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("gives one message for wrong email or password", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: new Error("x") });
    expect(await signIn(null, form("a@example.com", "bad"))).toEqual({
      error: "Email or password is incorrect.",
    });
  });

  it("signs out a valid user who isn't an admin", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await signIn(null, form("user@example.com", "pw"))).toEqual({
      error: "This account doesn't have admin access.",
    });
    expect(rpc).toHaveBeenCalledWith("is_admin");
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("sends an admin to the dashboard", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(signIn(null, form("admin@example.com", "pw"))).rejects.toThrow(
      "NEXT_REDIRECT /",
    );
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
