/** Amounts are integer minor units (cents), as stored by checkout. */
export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

type OrderAmounts = {
  status: string;
  amount: number;
  amount_paid: number;
  payment_mode: string;
};

/**
 * What was paid and what's still owed. Manual-payment orders keep a running
 * amount_paid; legacy orders (one-time checkout before manual payments) only
 * have a status, so they're either fully paid or not paid at all.
 */
export function orderMoney(order: OrderAmounts) {
  const paid =
    order.payment_mode === "manual"
      ? order.amount_paid
      : order.status === "paid"
        ? order.amount
        : 0;
  // Only an open order can still be paid off; closed ones owe nothing.
  const open = ["pending", "partially_paid"].includes(order.status);
  return {
    total: order.amount,
    paid,
    balance: open ? Math.max(0, order.amount - paid) : 0,
  };
}

/**
 * The Orders list's sortable columns, as URL values. Started sorts by
 * created_at: since checkout refreshes an unpaid order's date when the
 * customer returns, it's when checkout was opened, minutes before the first
 * payment the column shows.
 */
export const orderSorts = {
  payments: { column: "activity_at" },
  started: { column: "created_at" },
} as const;
export type OrderSort = keyof typeof orderSorts;
export type SortDirection = "asc" | "desc";

/** Clicking a header flips its direction, or starts another at newest first. */
export function nextSort(
  current: { sort: OrderSort; dir: SortDirection },
  clicked: OrderSort,
) {
  return {
    sort: clicked,
    dir:
      current.sort === clicked && current.dir === "desc"
        ? ("asc" as const)
        : ("desc" as const),
  };
}

/** A calendar day in UTC, as in the Orders list's date columns. */
export const formatDay = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** The newest payments first, up to `limit`, and how many more there are. */
export function latestPayments<T extends { paid_at: string | null }>(
  payments: readonly T[],
  limit = 3,
) {
  const time = (payment: T) =>
    payment.paid_at ? Date.parse(payment.paid_at) : 0;
  const newest = [...payments].sort((a, b) => time(b) - time(a));
  return {
    shown: newest.slice(0, limit),
    more: Math.max(0, newest.length - limit),
  };
}

export const statusLabels: Record<string, string> = {
  pending: "Checkout not finished",
  partially_paid: "Owes money",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
  refunded: "Refunded",
};

/** The list's filters, as URL values, and the statuses each one covers. */
export const statusFilters = {
  owing: { label: "Owes money", statuses: ["partially_paid"] },
  paid: { label: "Paid", statuses: ["paid"] },
  pending: { label: "Checkout not finished", statuses: ["pending"] },
  closed: { label: "Closed", statuses: ["failed", "canceled", "refunded"] },
  all: { label: "All", statuses: null },
} as const;
export type StatusFilter = keyof typeof statusFilters;

/**
 * Stripe Dashboard pages. Sandbox objects live under /test. From Stripe's
 * dashboard URL scheme; not part of a documented API.
 */
export function stripeUrl(
  kind: "payments" | "customers",
  id: string,
  livemode: boolean,
) {
  return `https://dashboard.stripe.com/${livemode ? "" : "test/"}${kind}/${id}`;
}

/**
 * Date and time as shown on order and email pages. Rendered on the server,
 * so the time zone is fixed and labelled rather than left to the server's
 * clock (UTC on Vercel, local time in development).
 */
export const formatWhen = (value: string | null) =>
  value
    ? `${new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })} UTC`
    : "—";

type EmailState = { status: string; attempts: number };

/**
 * An email's state in plain words. "pending" and "sending" both read as
 * Retrying once an attempt failed: sending is a worker's brief claim, and an
 * expired claim goes back to pending.
 */
export function emailStatusText(email: EmailState) {
  if (email.status === "sent") return "Sent";
  if (email.status === "review") return "Stopped retrying";
  return email.attempts === 0
    ? "Queued"
    : `Retrying (${email.attempts} failed attempt${email.attempts === 1 ? "" : "s"})`;
}

/**
 * Which email it is, from the snapshot checkout stored. Mirrors the site's
 * paymentEmail template: payment number 1 gets the course welcome, anything
 * else is sent as a receipt.
 */
export function emailKind(paymentNumber: unknown) {
  return paymentNumber === 1 ? "Course welcome" : "Payment receipt";
}

/**
 * The Emails page's filters. Problems leaves out emails queued moments ago
 * that haven't been tried yet; those normally go out in seconds.
 */
export const emailFilters = {
  attention: {
    label: "Problems",
    or: "status.eq.review,and(status.in.(pending,sending),attempts.gt.0)",
  },
  waiting: { label: "Not sent yet", or: "status.in.(pending,sending)" },
  review: { label: "Stopped retrying", or: "status.eq.review" },
  sent: { label: "Sent", or: "status.eq.sent" },
  all: { label: "All", or: null },
} as const;
export type EmailFilter = keyof typeof emailFilters;
