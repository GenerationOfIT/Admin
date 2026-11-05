import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in admin's Supabase client, or null when there is no session or
 * the user isn't in `admins`. The client uses the admin's own session, so RLS
 * still applies to every read and write made with it.
 *
 * cache() shares the answer within one server request only, so the layout's
 * and the page's checks cost one is_admin call; every new request (each
 * navigation or server action) checks again.
 */
export const getAdminClient = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return isAdmin ? supabase : null;
});

/**
 * First line of every admin page and server action. Server actions are
 * public URLs, so the layout's check doesn't protect them.
 */
export async function requireAdmin() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/login");
  return supabase;
}
