import { requireAdmin } from "@/lib/auth";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
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
  formatDay,
  formatMoney,
  latestPayments,
  nextSort,
  orderMoney,
  orderSorts,
  statusFilters,
  statusLabels,
  type OrderSort,
  type SortDirection,
  type StatusFilter,
} from "./order.helpers";

const PAGE_SIZE = 50;

type SearchParams = {
  status?: string;
  mode?: string;
  q?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status: StatusFilter =
    params.status && params.status in statusFilters
      ? (params.status as StatusFilter)
      : "owing";
  // Sandbox and live orders are never mixed, so each view shows one of them.
  const live = params.mode === "live";
  const query = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort: OrderSort =
    params.sort && params.sort in orderSorts
      ? (params.sort as OrderSort)
      : "payments";
  const dir: SortDirection = params.dir === "asc" ? "asc" : "desc";
  const db = await requireAdmin();

  let orders = db
    .from("orders")
    .select(
      "id, status, amount, amount_paid, currency, payment_mode, created_at, first_paid_at, paid_at, customers!inner(full_name, email), courses(title)",
      { count: "exact" },
    )
    .eq("stripe_livemode", live)
    // Payments: the latest payment, or when checkout was opened if nothing is
    // paid yet. id breaks ties so pages don't overlap.
    .order(orderSorts[sort].column, { ascending: dir === "asc" })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const statuses = statusFilters[status].statuses;
  if (statuses) orders = orders.in("status", [...statuses]);
  if (query) {
    // Quoted, so dots and @ in emails are read as text; characters that
    // could end the quotes or the filter list are dropped.
    const term = query.replace(/[,()"\\]/g, " ");
    orders = orders.or(`full_name.ilike."%${term}%",email.ilike."%${term}%"`, {
      referencedTable: "customers",
    });
  }
  const [{ data: rows, count, error }, owing] = await Promise.all([
    orders,
    db
      .from("orders")
      .select("amount, amount_paid")
      .eq("stripe_livemode", live)
      .eq("status", "partially_paid"),
  ]);
  if (error) throw error;
  if (owing.error) throw owing.error;
  const paidAttempts = rows.length
    ? await db
        .from("course_payment_attempts")
        .select("order_id, amount, currency, paid_at")
        .eq("status", "paid")
        .in(
          "order_id",
          rows.map((order) => order.id),
        )
    : { data: [], error: null };
  if (paidAttempts.error) throw paidAttempts.error;
  const paymentsByOrder = new Map<
    string,
    { amount: number; currency: string; paid_at: string | null }[]
  >();
  for (const attempt of paidAttempts.data)
    paymentsByOrder.set(attempt.order_id, [
      ...(paymentsByOrder.get(attempt.order_id) ?? []),
      attempt,
    ]);
  // Orders from the earlier one-time checkout have no payment rows; their one
  // payment is the order itself.
  const paymentsOf = (order: (typeof rows)[number]) =>
    paymentsByOrder.get(order.id) ??
    (order.payment_mode !== "manual" && order.paid_at
      ? [
          {
            amount: order.amount,
            currency: order.currency,
            paid_at: order.paid_at,
          },
        ]
      : []);
  const outstanding = owing.data.reduce(
    (sum, order) => sum + (order.amount - order.amount_paid),
    0,
  );
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (change: Partial<SearchParams>) => {
    const next = new URLSearchParams();
    const merged: Partial<SearchParams> = {
      status,
      mode: live ? "live" : "test",
      q: query,
      sort,
      dir,
      ...change,
    };
    // Left out of the address while on the default, newest payments first.
    if (merged.sort === "payments") merged.sort = undefined;
    if (merged.dir === "desc") merged.dir = undefined;
    for (const [key, value] of Object.entries(merged))
      if (value) next.set(key, String(value));
    return `/orders?${next}`;
  };

  return (
    <PendingNavigation>
      <div className="max-w-6xl">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
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
          Read-only. {owing.data.length} order
          {owing.data.length === 1 ? "" : "s"} owe money,{" "}
          {formatMoney(outstanding)} outstanding. Refunds are made in Stripe and
          don&apos;t update these orders yet.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(Object.keys(statusFilters) as StatusFilter[]).map((value) => (
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
              <StableLabel>{statusFilters[value].label}</StableLabel>
            </PendingLink>
          ))}
          <PendingForm className="ml-auto flex gap-2" action="/orders">
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="mode" value={live ? "live" : "test"} />
            {sort !== "payments" && (
              <input type="hidden" name="sort" value={sort} />
            )}
            {dir !== "desc" && <input type="hidden" name="dir" value={dir} />}
            <input
              name="q"
              defaultValue={query}
              placeholder="Name or email"
              aria-label="Search customers"
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
            <p className="text-muted">No orders match.</p>
          ) : (
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="text-muted text-left text-xs">
                  <tr className="border-border border-b">
                    <SortHeader
                      column="started"
                      label="Started (UTC)"
                      current={{ sort, dir }}
                      href={(next) => link({ ...next, page: undefined })}
                    />
                    <th className="px-4 py-2 font-normal">Customer</th>
                    <th className="px-4 py-2 font-normal">Course</th>
                    <SortHeader
                      column="payments"
                      label="Payments (UTC)"
                      current={{ sort, dir }}
                      href={(next) => link({ ...next, page: undefined })}
                    />
                    <th className="px-4 py-2 text-right font-normal">Paid</th>
                    <th className="px-4 py-2 text-right font-normal">
                      Balance
                    </th>
                    <th className="px-4 py-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {rows.map((order) => {
                    const money = orderMoney(order);
                    const payments = latestPayments(paymentsOf(order));
                    const href = `/orders/${order.id}`;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-surface cursor-pointer"
                      >
                        <LinkCell
                          href={href}
                          first
                          className="whitespace-nowrap"
                        >
                          {/* The first payment; until then, when checkout was opened. */}
                          {formatDay(order.first_paid_at ?? order.created_at)}
                        </LinkCell>
                        <LinkCell href={href} className="flex-col items-start">
                          <span className="font-bold">
                            {order.customers.full_name}
                          </span>
                          <span className="text-muted text-xs">
                            {order.customers.email}
                          </span>
                        </LinkCell>
                        <LinkCell href={href}>
                          {order.courses?.title ?? "—"}
                        </LinkCell>
                        <LinkCell
                          href={href}
                          className="flex-col items-start whitespace-nowrap"
                        >
                          {payments.shown.length === 0 ? (
                            <span className="text-muted">—</span>
                          ) : (
                            payments.shown.map((payment, index) => (
                              <span key={index}>
                                {payment.paid_at && formatDay(payment.paid_at)}{" "}
                                <span className="text-muted">
                                  ·{" "}
                                  {formatMoney(
                                    payment.amount,
                                    payment.currency,
                                  )}
                                </span>
                              </span>
                            ))
                          )}
                          {payments.more > 0 && (
                            <span className="text-muted text-xs">
                              +{payments.more} more
                            </span>
                          )}
                        </LinkCell>
                        <LinkCell
                          href={href}
                          className="justify-end whitespace-nowrap"
                        >
                          {formatMoney(money.paid, order.currency)}
                          <span className="text-muted">
                            &nbsp;/ {formatMoney(money.total, order.currency)}
                          </span>
                        </LinkCell>
                        <LinkCell
                          href={href}
                          className={cn(
                            "justify-end whitespace-nowrap",
                            money.balance > 0 && "text-danger font-bold",
                          )}
                        >
                          {money.balance > 0
                            ? formatMoney(money.balance, order.currency)
                            : "—"}
                        </LinkCell>
                        <LinkCell href={href}>
                          {statusLabels[order.status] ?? order.status}
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
                  <ArrowLeft size={14} aria-hidden="true" />{" "}
                  {dir === "desc" ? "Newer" : "Older"}
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
                  {dir === "desc" ? "Older" : "Newer"}{" "}
                  <ArrowRight size={14} aria-hidden="true" />
                </PendingLink>
              )}
            </nav>
          )}
        </PendingContent>
      </div>
    </PendingNavigation>
  );
}

/** A column header that sorts by it; clicking again flips the direction. */
function SortHeader({
  column,
  label,
  current,
  href,
}: {
  column: OrderSort;
  label: string;
  current: { sort: OrderSort; dir: SortDirection };
  href: (next: { sort: OrderSort; dir: SortDirection }) => string;
}) {
  const active = current.sort === column;
  const Arrow = current.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className="px-4 py-2 font-normal"
      aria-sort={
        active
          ? current.dir === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <PendingLink
        href={href(nextSort(current, column))}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1",
          active && "text-foreground font-bold",
        )}
      >
        <StableLabel>{label}</StableLabel>
        {active && <Arrow size={12} aria-hidden="true" />}
      </PendingLink>
    </th>
  );
}
