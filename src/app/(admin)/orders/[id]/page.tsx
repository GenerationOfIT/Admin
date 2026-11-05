import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { FormSection } from "@/components/ui/FormSection";
import { cn } from "@/lib/cn";
import {
  emailKind,
  emailStatusText,
  formatMoney,
  formatWhen as when,
  orderMoney,
  statusLabels,
  stripeUrl,
} from "../order.helpers";

function StripeLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary inline-flex items-center gap-1 hover:underline"
    >
      {label} <ExternalLink size={12} />
    </a>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await requireAdmin();
  const [{ data: order, error }, attempts, emails] = await Promise.all([
    db
      .from("orders")
      .select(
        "*, customers(full_name, email, phone, stripe_customer_id, stripe_test_customer_id), courses(id, title)",
      )
      .eq("id", id.data)
      .maybeSingle(),
    db
      .from("course_payment_attempts")
      .select(
        "id, amount, currency, status, stripe_payment_intent_id, paid_at, created_at",
      )
      .eq("order_id", id.data)
      .order("created_at", { ascending: false }),
    db
      .from("order_emails")
      .select(
        "id, recipient, status, attempts, sent_at, last_error, created_at, payment_number:payload->paymentNumber",
      )
      .eq("order_id", id.data)
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (attempts.error) throw attempts.error;
  if (emails.error) throw emails.error;
  if (!order) notFound();

  const money = orderMoney(order);
  const customer = order.customers;
  const stripeCustomer = order.stripe_livemode
    ? customer?.stripe_customer_id
    : customer?.stripe_test_customer_id;

  return (
    <div className="max-w-4xl">
      <BackLink
        href={`/orders?mode=${order.stripe_livemode ? "live" : "test"}&status=all`}
      >
        Orders
      </BackLink>
      {/* Titled by what was bought, so it reads as an order, not a customer page. */}
      <p className="text-muted mt-2 text-sm">
        Order{customer?.full_name && ` by ${customer.full_name}`}
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">
          {order.courses?.title ?? "Order"}
        </h1>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            order.status === "partially_paid"
              ? "border-danger text-danger"
              : "border-border text-muted",
          )}
        >
          {statusLabels[order.status] ?? order.status}
        </span>
        {!order.stripe_livemode && (
          <span className="border-border text-muted rounded-full border px-2 py-0.5 text-xs">
            Sandbox
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <FormSection title="Payment">
          <dl className="grid gap-5 sm:grid-cols-3">
            <Detail label="Tuition">
              {formatMoney(money.total, order.currency)}
            </Detail>
            <Detail label="Paid">
              {formatMoney(money.paid, order.currency)}
              {order.payment_mode === "manual" &&
                ` in ${order.successful_payment_count} payment${order.successful_payment_count === 1 ? "" : "s"}`}
            </Detail>
            <Detail label="Balance">
              <span
                className={cn(money.balance > 0 && "text-danger font-bold")}
              >
                {formatMoney(money.balance, order.currency)}
              </span>
            </Detail>
            {order.payment_mode === "manual" && order.minimum_payment && (
              <Detail label="Minimum payment">
                {formatMoney(order.minimum_payment, order.currency)}
              </Detail>
            )}
            {order.refunded_amount > 0 && (
              <Detail label="Refunded">
                {formatMoney(order.refunded_amount, order.currency)}
              </Detail>
            )}
            <Detail label="Ordered">{when(order.created_at)}</Detail>
            <Detail label="Fully paid">{when(order.paid_at)}</Detail>
            <Detail label="Course">
              {order.courses ? (
                <Link
                  href={`/courses/${order.courses.id}`}
                  className="hover:underline"
                >
                  {order.courses.title}
                </Link>
              ) : (
                "—"
              )}
            </Detail>
          </dl>
          {order.payment_mode === "legacy" && (
            <p className="text-muted mt-5 text-xs">
              Bought with the earlier one-time checkout, so there&apos;s no
              payment history below.
              {order.stripe_payment_intent_id && (
                <>
                  {" "}
                  <StripeLink
                    href={stripeUrl(
                      "payments",
                      order.stripe_payment_intent_id,
                      order.stripe_livemode,
                    )}
                    label="Open the payment in Stripe"
                  />
                </>
              )}
            </p>
          )}
        </FormSection>

        <FormSection title="Customer">
          <dl className="grid gap-5 sm:grid-cols-3">
            <Detail label="Name">{customer?.full_name ?? "—"}</Detail>
            <Detail label="Email">
              {customer?.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:underline"
                >
                  {customer.email}
                </a>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label="Phone">
              {customer?.phone ? (
                <a href={`tel:${customer.phone}`} className="hover:underline">
                  {customer.phone}
                </a>
              ) : (
                "—"
              )}
            </Detail>
            {order.checkout_email &&
              order.checkout_email !== customer?.email && (
                <Detail label="Checkout email">{order.checkout_email}</Detail>
              )}
          </dl>
          {stripeCustomer && (
            <p className="mt-5 text-sm">
              <StripeLink
                href={stripeUrl(
                  "customers",
                  stripeCustomer,
                  order.stripe_livemode,
                )}
                label="Open the customer in Stripe"
              />
            </p>
          )}
        </FormSection>

        {order.payment_mode === "manual" && (
          <FormSection title="Payments">
            {attempts.data.length === 0 ? (
              <p className="text-muted text-sm">No payments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-muted text-left text-xs">
                  <tr>
                    <th className="pb-2 font-normal">Started</th>
                    <th className="pb-2 font-normal">Paid</th>
                    <th className="pb-2 text-right font-normal">Amount</th>
                    <th className="pb-2 font-normal">Status</th>
                    <th className="pb-2 font-normal" />
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {attempts.data.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="py-2">{when(attempt.created_at)}</td>
                      <td className="py-2">{when(attempt.paid_at)}</td>
                      <td className="py-2 text-right">
                        {formatMoney(attempt.amount, attempt.currency)}
                      </td>
                      <td
                        className={cn(
                          "py-2",
                          attempt.status === "paid"
                            ? "text-accent"
                            : "text-muted",
                        )}
                      >
                        {/* An expired attempt is a checkout left unpaid. */}
                        {attempt.status === "paid"
                          ? "Paid"
                          : attempt.status === "expired"
                            ? "Not completed"
                            : "In progress"}
                      </td>
                      <td className="py-2 text-right">
                        {attempt.stripe_payment_intent_id && (
                          <StripeLink
                            href={stripeUrl(
                              "payments",
                              attempt.stripe_payment_intent_id,
                              order.stripe_livemode,
                            )}
                            label="Stripe"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </FormSection>
        )}

        <FormSection title="Emails">
          {emails.data.length === 0 ? (
            <p className="text-muted text-sm">No emails for this order.</p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {emails.data.map((email) => (
                <li key={email.id} className="flex flex-wrap gap-x-4 py-2">
                  <span className="min-w-40">
                    {when(email.sent_at ?? email.created_at)}
                  </span>
                  <span>{emailKind(email.payment_number)}</span>
                  <span className="text-muted">{email.recipient}</span>
                  <span
                    className={cn(
                      email.status === "sent"
                        ? "text-accent"
                        : email.status === "review"
                          ? "text-danger"
                          : "text-muted",
                    )}
                  >
                    {emailStatusText(email)}
                  </span>
                  {email.last_error && email.status !== "sent" && (
                    <span className="text-muted w-full text-xs">
                      {email.last_error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </FormSection>
      </div>
    </div>
  );
}
