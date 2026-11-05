import { describe, expect, it } from "vitest";
import {
  emailKind,
  emailStatusText,
  formatDay,
  formatMoney,
  formatWhen,
  latestPayments,
  nextSort,
  orderMoney,
  stripeUrl,
} from "@/app/(admin)/orders/order.helpers";

describe("formatWhen", () => {
  it("shows the time in UTC, labelled, whatever the server's time zone", () => {
    expect(formatWhen("2026-10-28T23:30:00Z")).toBe("28 Oct 2026, 23:30 UTC");
    expect(formatWhen(null)).toBe("—");
  });
});

describe("email wording", () => {
  it("names each email state", () => {
    expect(emailStatusText({ status: "sent", attempts: 1 })).toBe("Sent");
    expect(emailStatusText({ status: "review", attempts: 4 })).toBe(
      "Stopped retrying",
    );
    expect(emailStatusText({ status: "pending", attempts: 0 })).toBe("Queued");
    expect(emailStatusText({ status: "sending", attempts: 1 })).toBe(
      "Retrying (1 failed attempt)",
    );
    expect(emailStatusText({ status: "pending", attempts: 3 })).toBe(
      "Retrying (3 failed attempts)",
    );
  });

  it("names the first payment's email the welcome and the rest receipts", () => {
    expect(emailKind(1)).toBe("Course welcome");
    expect(emailKind(2)).toBe("Payment receipt");
    // The site's template sends a receipt whenever the number isn't 1.
    expect(emailKind(null)).toBe("Payment receipt");
  });
});

describe("orderMoney", () => {
  it("uses the running total for manual payments", () => {
    expect(
      orderMoney({
        payment_mode: "manual",
        status: "partially_paid",
        amount: 90000,
        amount_paid: 25000,
      }),
    ).toEqual({ total: 90000, paid: 25000, balance: 65000 });
  });

  it("treats a paid legacy order as fully paid", () => {
    expect(
      orderMoney({
        payment_mode: "legacy",
        status: "paid",
        amount: 1000,
        amount_paid: 0,
      }),
    ).toEqual({ total: 1000, paid: 1000, balance: 0 });
  });

  it("doesn't count closed orders as owing", () => {
    for (const status of ["canceled", "failed", "refunded"])
      expect(
        orderMoney({
          payment_mode: "manual",
          status,
          amount: 90000,
          amount_paid: 10000,
        }).balance,
      ).toBe(0);
  });
});

describe("formatting and links", () => {
  it("formats cents as currency", () => {
    expect(formatMoney(90000)).toBe("$900.00");
    expect(formatMoney(1999, "usd")).toBe("$19.99");
  });

  it("points sandbox objects at Stripe's test dashboard", () => {
    expect(stripeUrl("payments", "pi_1", false)).toBe(
      "https://dashboard.stripe.com/test/payments/pi_1",
    );
    expect(stripeUrl("customers", "cus_1", true)).toBe(
      "https://dashboard.stripe.com/customers/cus_1",
    );
  });
});

describe("order list dates", () => {
  it("shows a calendar day in UTC", () => {
    expect(formatDay("2026-11-03T23:30:00+00:00")).toBe("3 Nov 2026");
  });

  it("lists the newest three payments and counts the rest", () => {
    const paid = (day: number) => ({
      amount: day,
      paid_at: `2026-11-0${day}T10:00:00+00:00`,
    });
    const { shown, more } = latestPayments([
      paid(2),
      paid(5),
      paid(1),
      paid(4),
      paid(3),
    ]);
    expect(shown.map((payment) => payment.amount)).toEqual([5, 4, 3]);
    expect(more).toBe(2);
  });

  it("shows every payment when there are three or fewer", () => {
    expect(latestPayments([])).toEqual({ shown: [], more: 0 });
    expect(
      latestPayments([{ paid_at: "2026-11-01T10:00:00+00:00" }]).more,
    ).toBe(0);
  });
});

describe("order list sorting", () => {
  it("flips the clicked column, or starts another at newest first", () => {
    const current = { sort: "payments", dir: "desc" } as const;
    expect(nextSort(current, "payments")).toEqual({
      sort: "payments",
      dir: "asc",
    });
    expect(nextSort({ ...current, dir: "asc" }, "payments")).toEqual({
      sort: "payments",
      dir: "desc",
    });
    expect(nextSort(current, "started")).toEqual({
      sort: "started",
      dir: "desc",
    });
  });
});
