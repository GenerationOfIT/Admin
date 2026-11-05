import { requireAdmin } from "@/lib/auth";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { inputClass } from "@/components/ui/Field";
import { buttonVariants } from "@/components/ui/Button";
import { LinkCell } from "@/components/ui/LinkCell";
import {
  PendingContent,
  PendingForm,
  PendingLink,
  PendingNavigation,
} from "@/components/ui/PendingNavigation";
import { cn } from "@/lib/cn";
import { StableLabel } from "@/components/ui/StableLabel";
import {
  emailFilters,
  emailKind,
  emailStatusText,
  formatWhen,
  type EmailFilter,
} from "../orders/order.helpers";

const PAGE_SIZE = 50;

type SearchParams = {
  status?: string;
  mode?: string;
  q?: string;
  page?: string;
};

/**
 * Payment emails across all orders. Read-only: failed sends retry on their
 * own, and one that stopped retrying must be checked in the email service's logs
 * first, since resending blindly could send it twice.
 */
export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status: EmailFilter =
    params.status && params.status in emailFilters
      ? (params.status as EmailFilter)
      : "attention";
  // An email belongs to a Sandbox or Live order; the views never mix them.
  const live = params.mode === "live";
  const query = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const db = await requireAdmin();

  let emails = db
    .from("order_emails")
    .select(
      "id, recipient, status, attempts, last_error, next_attempt_at, sent_at, created_at, order_id, payment_number:payload->paymentNumber, orders!inner(stripe_livemode)",
      { count: "exact" },
    )
    .eq("orders.stripe_livemode", live)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const filter = emailFilters[status].or;
  if (filter) emails = emails.or(filter);
  if (query) emails = emails.ilike("recipient", `%${query}%`);
  const [{ data: rows, count, error }, attention] = await Promise.all([
    emails,
    db
      .from("order_emails")
      .select("id, orders!inner(stripe_livemode)", {
        count: "exact",
        head: true,
      })
      .eq("orders.stripe_livemode", live)
      .or(emailFilters.attention.or),
  ]);
  if (error) throw error;
  if (attention.error) throw attention.error;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (change: Partial<SearchParams>) => {
    const next = new URLSearchParams();
    const merged = {
      status,
      mode: live ? "live" : "test",
      q: query,
      ...change,
    };
    for (const [key, value] of Object.entries(merged))
      if (value) next.set(key, String(value));
    return `/emails?${next}`;
  };
  const needAttention = attention.count ?? 0;

  return (
    <PendingNavigation>
      <div className="max-w-6xl">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Emails</h1>
          <nav aria-label="Environment" className="flex gap-1 text-sm">
            {[
              ["test", "Sandbox"],
              ["live", "Live"],
            ].map(([value, label]) => (
              <PendingLink
                key={value}
                href={link({ mode: value, page: undefined })}
                aria-current={(value === "live") === live ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1",
                  (value === "live") === live
                    ? "bg-foreground text-ink font-bold"
                    : "text-muted hover:text-foreground",
                )}
              >
                <StableLabel>{label}</StableLabel>
              </PendingLink>
            ))}
          </nav>
        </div>
        <p className="text-muted mb-6 text-sm">
          Read-only. Payment emails for every order.{" "}
          {needAttention === 0 ? (
            "No problems."
          ) : (
            <span className="text-danger font-bold">
              {needAttention} email{needAttention === 1 ? " has" : "s have"}{" "}
              problems.
            </span>
          )}{" "}
          Failed emails retry on their own; ones that stopped retrying must be
          checked in the email service&apos;s logs before anything is resent.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(Object.keys(emailFilters) as EmailFilter[]).map((value) => (
            <PendingLink
              key={value}
              href={link({ status: value, page: undefined })}
              aria-current={value === status ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                value === status
                  ? "border-accent text-accent font-bold"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              <StableLabel>{emailFilters[value].label}</StableLabel>
            </PendingLink>
          ))}
          <PendingForm className="ml-auto flex gap-2" action="/emails">
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="mode" value={live ? "live" : "test"} />
            <input
              name="q"
              defaultValue={query}
              placeholder="Recipient email"
              aria-label="Search recipients"
              className={cn(inputClass, "w-56 py-1.5")}
            />
            <button
              type="submit"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Search
            </button>
          </PendingForm>
        </div>

        <PendingContent>
          {rows.length === 0 ? (
            <p className="text-muted">No emails match.</p>
          ) : (
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="text-muted text-left text-xs">
                  <tr className="border-border border-b">
                    <th className="px-4 py-2 font-normal">Date</th>
                    <th className="px-4 py-2 font-normal">Recipient</th>
                    <th className="px-4 py-2 font-normal">Email</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="px-4 py-2 font-normal">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {rows.map((email) => {
                    const href = `/orders/${email.order_id}`;
                    const unsent = email.status !== "sent";
                    return (
                      <tr
                        key={email.id}
                        className="hover:bg-surface cursor-pointer"
                      >
                        <LinkCell
                          href={href}
                          first
                          className="whitespace-nowrap"
                        >
                          {formatWhen(email.sent_at ?? email.created_at)}
                        </LinkCell>
                        <LinkCell href={href}>{email.recipient}</LinkCell>
                        <LinkCell href={href} className="whitespace-nowrap">
                          {emailKind(email.payment_number)}
                        </LinkCell>
                        <LinkCell
                          href={href}
                          className={cn(
                            "flex-col items-start",
                            email.status === "sent"
                              ? "text-accent"
                              : email.status === "review"
                                ? "text-danger font-bold"
                                : "text-muted",
                          )}
                        >
                          {emailStatusText(email)}
                          {unsent &&
                            email.status !== "review" &&
                            email.attempts > 0 && (
                              <span className="text-muted text-xs font-normal">
                                Earliest retry{" "}
                                {formatWhen(email.next_attempt_at)}
                              </span>
                            )}
                        </LinkCell>
                        <LinkCell href={href} className="text-muted text-xs">
                          <span className="line-clamp-2">
                            {unsent ? (email.last_error ?? "—") : "—"}
                          </span>
                        </LinkCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <nav
              aria-label="Pages"
              className="mt-4 flex items-center gap-4 text-sm"
            >
              {page > 1 && (
                <PendingLink
                  href={link({ page: String(page - 1) })}
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <ArrowLeft size={14} aria-hidden="true" /> Newer
                </PendingLink>
              )}
              <span className="text-muted">
                Page {page} of {pages}
              </span>
              {page < pages && (
                <PendingLink
                  href={link({ page: String(page + 1) })}
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  Older <ArrowRight size={14} aria-hidden="true" />
                </PendingLink>
              )}
            </nav>
          )}
        </PendingContent>
      </div>
    </PendingNavigation>
  );
}
