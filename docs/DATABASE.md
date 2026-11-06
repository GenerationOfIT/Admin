# GenofIT database guide

For developers who will work on GenofIT after us. It explains how the database is built, who talks to it, and how the important flows (content, checkout, emails, cache refresh) work.

Written 2026-11-06. The live database is the source of truth: if this file and the database disagree, the database wins. Update this file when you add a migration that changes how things work.

**How far each part is verified:**

- **Database parts** (tables, columns, constraints, policies, functions, triggers) were read from the migrations in `supabase/migrations`, up to `20261106160000`, which match the live database as of 2026-11-06.
- **Site code parts** were read from the old local copy of the site (`Sandroo10/GenOfIT`), **not** from the company repo (`GenerationOfIT/Site`), which has newer code (for example the checkout expiry and late-retry changes). They are marked **(Unverified: site code)**. Please check them against the company repo and remove the mark once confirmed.
- **Admin panel parts** were read from the admin repo as of 2026-11-06 and are marked **(Admin code)**.

## Contents

1. [The big picture](#1-the-big-picture)
2. [Making changes: migrations and types](#2-making-changes-migrations-and-types)
3. [Who can read and write what](#3-who-can-read-and-write-what)
4. [Content tables](#4-content-tables)
5. [Customer and payment tables](#5-customer-and-payment-tables)
6. [How a course payment works](#6-how-a-course-payment-works)
7. [Payment emails](#7-payment-emails)
8. [Site refresh after content changes](#8-site-refresh-after-content-changes)
9. [Images (Storage)](#9-images-storage)
10. [Rate limits](#10-rate-limits)
11. [Scheduled jobs](#11-scheduled-jobs)
12. [Leftovers and special rows](#12-leftovers-and-special-rows)
13. [Useful SQL](#13-useful-sql)
14. [Known limitations](#14-known-limitations)

## 1. The big picture

The database is a **Supabase** project (Postgres 17, Free plan, US West region). Three things use it. The connection details in this table are **(Unverified: site code)**:

| Who | How it connects | What it does |
|---|---|---|
| **Website** (Next.js, `www.genofit.tech`) | Public key for content; secret (service role) key on the server for checkout | Shows courses, events, services and so on; runs checkout; records Stripe payments; sends emails |
| **Admin panel** (separate Next.js app) | Signed-in admin users (Supabase Auth) | Edits content and images; reads orders and emails |
| **Stripe** (indirectly) | Calls the website's webhook, never the database | The website records each payment in the database |

Some rules apply everywhere:

- **Money is stored in cents** as integers. `95000` means $950.00. Only US dollars (`currency = 'usd'`).
- **Sandbox and Live are kept apart.** Every order has `stripe_livemode` (false for Sandbox test payments, true for real ones). Checkout never mixes them.
- **Dates for enrollment and registration windows are calendar days in Tbilisi time** (`Asia/Tbilisi`). Timestamps (`created_at`, `paid_at`, …) are stored in UTC.
- **Content is "published" or not.** The public site only ever sees published rows (enforced by the database, see section 3).

## 2. Making changes: migrations and types

**Every change to the database structure goes through a migration file**, never through the dashboard's table editor. That keeps the repo and the live database identical.

- Files live in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`. The timestamp decides the order and must be unique.
- Apply them with the Supabase CLI from the repo folder (after `supabase link`):
  ```powershell
  supabase db push
  ```
  It lists the migrations it is about to apply. `supabase migration list` shows local and remote side by side.
- A migration that is already applied is never re-run, even if you edit the file. To change something, write a **new** migration.
- If `db push` says "Remote migration versions not found in local migrations directory", someone applied a migration that your branch doesn't have. Pull or merge their branch; don't use `migration repair` or `db pull` to paper over it.
- When a change must go out together with website code, the usual order is: apply the migration first, then deploy the code. Make the migration safe for the **old** code too, because it runs against the old code until the deploy finishes (see the checkout expiry story in section 6).

**TypeScript types.** Both apps have `src/types/supabase.ts`, generated from the database:

```powershell
supabase gen types typescript --linked > src/types/supabase.ts
```

- The admin's file is a plain generated file. Regenerate it after each migration.
- **(Unverified: site code)** The site's file has hand-written parts (for example `claim_order_email` and custom row types used by `src/lib/email/outbox.ts`). Regenerating it breaks one `rpc("claim_order_email", {})` call. Fix that call once, then always regenerate instead of editing by hand.

**Database tests.** `tests/database/*.sql` run in CI against a fresh local Supabase (`supabase start`, all migrations, no seed). They cover payment balances, duplicates, verification limits and email leases. See `supabase/README.md`.

## 3. Who can read and write what

Supabase gives every request a Postgres role:

| Role | Who | Access |
|---|---|---|
| `anon` | Website visitors (public key) | Read published content only |
| `authenticated` | Signed-in users (the admin panel) | Content read/write, orders read, **only if the user is an admin** |
| `service_role` | The website's server (secret key) | Everything; bypasses row level security. Used for checkout, payments, emails, rate limits |

How it is enforced:

- **Grants.** Migration `20261018150000_tighten_grants.sql` removed Supabase's old default "everyone gets everything" grants. New tables get **no** access automatically; each migration grants exactly what it needs. If you add a table and forget the grants, the site and admin simply can't see it.
- **Row level security (RLS)** is on for every table. Content tables have two policies: "Public can read published …" (`is_published = true`, or the parent row is published) and "Admins manage …" (full access when `is_admin()`).
- **Admins.** `public.is_admin()` returns true when the signed-in user's id is in `public.admins (user_id, email)`. To add an admin: create the user in Supabase Auth (dashboard, Authentication), then insert their `user_id` and email into `admins`.
- **Private tables** (`customers`, `orders`, `course_payment_attempts`, `order_emails`): admins can **read** them; nobody but the server writes them. `checkout_email_verifications` and `service_request_limits` are server-only.
- **Functions** that change payment data are `security invoker` and granted to `service_role` only, so they can't be called from a browser.

## 4. Content tables

Everything the admin panel edits. All have `sort_order` for manual ordering, and the main tables have `is_published`, `created_at`, `updated_at` (kept current by the `set_updated_at` trigger).

### Courses

| Table | What it holds |
|---|---|
| `courses` | One row per course: `slug` (URL), titles and texts for each page section, SEO title/description, `starts_on`, enrollment window (`enrollment_open`, `enrollment_opens_on`, `enrollment_closes_on`), `is_popular`, `is_curriculum_course` |
| `course_plans` | **Exactly one row per course** (unique `course_id`): the price. `amount` (cents), `minimum_payment` (cents, per part), `manual_payments_enabled` (pay in parts), `is_active`, plus the pricing card's `title`, `description`, `features` |
| `course_stats` | Label/value pairs on the course page (e.g. "Format: Online"). The one labelled "Format" is also used in payment emails |
| `course_overview_items`, `course_modules`, `course_outcomes`, `course_capstone_items` | Lists shown on the course page (title + description each) |
| `course_lecturers` | Lecturers per course: name, role, photo, LinkedIn (optional) |

Rules the database enforces: with enrollment switched on, both dates are required and the closing date can't be before the opening date (`courses_enrollment_window_valid`); enrollment must close on or before the course start date (`courses_enrollment_before_start`).

Deleting a course: child rows are deleted with it (`on delete cascade`). A course with orders **can't** be deleted, because orders point at it without cascading; unpublish it instead. A trigger (`unlink_course_testimonials`) unpublishes and unlinks its testimonials first.

### Events

| Table | What it holds |
|---|---|
| `events` | Title, texts, `starts_at`/`ends_at`, `timezone` (validated by `is_valid_timezone`), location and address, `price` (cents, 0 = free), registration window, image |
| `event_highlights`, `event_agenda_items`, `event_speakers` | Lists on the event page |

A published event needs a registration opening date (`events_published_need_registration`). The site's registration form doesn't take payments or save sign-ups yet (orders have columns for events, see section 12, but nothing creates them).

### Services, team, testimonials, partners, graduates

| Table | What it holds |
|---|---|
| `services` + `service_scope_items`, `service_use_cases`, `service_deliverables` | Service pages and their lists |
| `team_members` | People on the About page |
| `testimonials` | Quotes. `type` is graduate or client; a graduate quote can link to a course (`course_id`), a client quote to a service (`service_slug`). Placement flags `show_on_home` / `show_on_academy` with their own sort orders. Constraints keep the type and links consistent, and a published testimonial must be placed somewhere |
| `partners` | Logos for the home page strip. A published partner needs a logo |
| `graduates` | Photo carousel on Graduates and About. A published graduate needs a photo |

## 5. Customer and payment tables

### `customers`

One row per email address. `email` is **unique and always lowercase** (a check constraint enforces it). The site trims and lowercases emails before saving **(Unverified: site code)**. Also `full_name`, `phone`, and Stripe customer ids. Checkout inserts with `on conflict (email) do nothing`, so a returning customer keeps their first name and phone.

### `orders`

One row per purchase. The important columns:

| Column | Meaning |
|---|---|
| `customer_id`, `course_id`, `plan_id` | Who bought which course |
| `status` | `pending` (nothing paid yet; the admin calls it "Checkout not finished"), `partially_paid` ("Owes money"), `paid`, and `failed` / `canceled` / `refunded` (only from older flows) |
| `amount` | The agreed total price in cents |
| `amount_paid` | Sum of successful payments in cents (never more than `amount`) |
| `minimum_payment` | Smallest allowed part for this order. The last part may be smaller |
| `successful_payment_count` | How many payments went through. The next email says "payment N+1" |
| `payment_mode` | `manual` for every current course order; `legacy` for orders from the removed one-time checkout |
| `stripe_livemode` | Sandbox (false) or Live (true) |
| `checkout_email`, `checkout_verification_id` | The verified email the receipts go to, and the verification it came from |
| `course_email_snapshot` | JSON with the course title, intro, start date, format, customer name, URLs and email sender, frozen at checkout. **Payment emails are built from it**, so it must never be empty on a manual order (see section 7) |
| `created_at` | When checkout was opened (reset to "now" when an unpaid order is reused) |
| `first_paid_at`, `last_paid_at`, `paid_at` | First payment, latest payment, and when it became fully paid |
| `activity_at` | Generated: latest payment, or `created_at` if nothing is paid. The admin sorts by it |

Two unique indexes shape the flow:

- `one_unfinished_manual_purchase`: at most **one open order** (`pending` or `partially_paid`) per customer, course and Sandbox/Live. A returning customer always gets their existing order back.
- `one_pending_course_payment`: at most **one open Stripe checkout** per order (see below).

### `course_payment_attempts`

One row per Stripe Checkout session, so one per "Continue to secure payment" click that reached Stripe. `id` is the email verification's id. `amount`, `status` (`pending`, `paid`, `expired`), `stripe_checkout_session_id`, `stripe_payment_intent_id`, `paid_at`, and `checkout_expires_at` (Unix seconds; when the Stripe page expires, see section 6). The admin's Payments column and order page list these.

### `checkout_email_verifications`

The 6-digit email codes. Only hashes are stored (code, browser session, IP), never the code itself. A code expires after 10 minutes, a verified one stays usable for 20 minutes, and 5 wrong tries lock it. Old rows are cleaned up automatically (section 10).

### `order_emails`

The email outbox: one row per email to send (section 7). `id` is a stable key such as `payment/<attempt id>`, so the same email is never queued twice.

## 6. How a course payment works

Course payments are "manual": the student chooses how much to pay each time (at least the minimum), and comes back to pay the rest. Nothing is charged automatically. Paying in full is the same flow with the whole balance.

Step 3 and the database functions in step 5 are verified against the migrations. Everything the website does around them (steps 1, 2, 4, and how step 5 reacts to Stripe) is **(Unverified: site code)**: the company repo changed checkout on 2026-11-06.

1. **Email code.** The student fills in the checkout form. The server calls `request_checkout_email_code` (rate limited) and emails a code. `verify_checkout_email_code` checks it.
2. **Balance (quote).** The server looks for an open order for that email and course (`src/lib/stripe/manual-payments.ts`):
   - An order **with money already paid** keeps its own price and minimum. Enrollment doesn't need to be open, so existing students can always pay their balance.
   - **No order, or one with nothing paid**: the course's current plan price applies, and enrollment must be open (published, switched on, today within the dates).
3. **Reserve the payment.** The server calls **`prepare_course_payment_v2`** in one transaction. It:
   - creates the customer if new and locks them, so two tabs can't race;
   - creates the order if there is none, or reuses the open one;
   - if the order has nothing paid and no open Stripe checkout, refreshes it to the current price, minimum and course snapshot, and sets `created_at` to now;
   - returns the existing open attempt if there is one, otherwise checks the amount (between the minimum and the remaining balance) and inserts a new attempt with `checkout_expires_at = now + 31 minutes`.
4. **Stripe page.** The server creates a Stripe Checkout session with inline `price_data` (no Stripe Price ids), `expires_at = checkout_expires_at`, and `metadata.order_id` / `metadata.course_payment_id`, then saves the session id on the attempt. If a reused attempt has an open session at an old price, the server expires it and asks the student to verify again.
5. **Payment confirmed.** Stripe calls `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`. The site re-reads the session from Stripe and then:
   - paid: **`record_course_payment`** marks the attempt paid, adds the amount to the order, updates status, counts and dates, and queues the payment email, all in one transaction. Receiving the same webhook twice changes nothing.
   - expired: **`expire_course_payment`** marks the attempt expired. The order stays open for next time.

Why the expiry is 31 minutes: Stripe requires at least 30 minutes, and the extra minute absorbs request time. A short expiry limits how long an old-price Stripe page stays payable. Attempts created before 2026-11-06 have `checkout_expires_at = null`; they keep Stripe's 24-hour default and must never be given an expiry later, because a retry with different parameters would be rejected by Stripe's idempotency check. If a session may exist but its id was never saved and it is too close to expiring, the site asks the student to contact the company instead of creating a second session. **(Unverified: site code.)** This late-retry guard is described from Sandro's notes; it isn't in the old local code at all.

Things to know:

- **Enrollment checks only happen when a checkout starts** (the database side is verified: `record_course_payment` doesn't look at enrollment). A Stripe page opened before enrollment closes (or before a price change) can still be paid for up to about 30 minutes, and the payment is recorded normally. To change a price safely: switch enrollment off, wait 35 minutes, change the price, switch it on (also in the admin Help page).
- **Price changes affect only orders with nothing paid.** Orders with a payment keep their agreed price forever.
- **The student must use the same email** to find their order. A different email is a new customer and a new purchase.

## 7. Payment emails

Emails go through an **outbox** so a slow or failing email provider (Resend) never loses or blocks a payment:

1. `record_course_payment` inserts a row into `order_emails` with `payload = course_email_snapshot + payment details`. `payload` is `not null`, so a manual order without a snapshot would make recording the payment fail.
2. **(Unverified: site code)** After answering Stripe, the webhook drains the outbox in the background (`drainEmailOutbox` in `src/lib/email/outbox.ts`). The daily keep-alive job and `POST /api/email/retry` (with `CRON_SECRET`) drain it too.
3. `claim_order_email` hands out one email at a time with a 2-minute lease (`status = 'sending'`, `lease_token`), so two workers never send the same one. Success sets `sent`; a failure schedules a retry (`next_attempt_at`).
4. After 23 hours of trying, an email moves to `review` ("Stopped retrying" in the admin), because Resend's duplicate protection only lasts 24 hours and a blind retry could send it twice.

There are **no scheduled or reminder emails** in the database. The old site code emails a student only when they ask for a code or when a payment is recorded **(Unverified: site code)**. The database only knows whether Resend accepted an email, not whether it was delivered.

## 8. Site refresh after content changes

The site caches content pages. When content changes, the database tells the site to refresh:

- Every content table has a statement-level trigger `revalidate_site` that calls `notify_revalidate()`.
- `notify_revalidate()` reads two secrets from **Supabase Vault**: `revalidate_url` (`https://www.genofit.tech/api/revalidate`) and `revalidate_secret` (the same value as the site's `REVALIDATE_SECRET` in Vercel). It POSTs `{"table": "<name>"}` with `Authorization: Bearer <secret>` through `pg_net`, after the transaction commits.
- **(Unverified: site code)** The site maps the table to a cache tag (`tagByTable` in `src/app/api/revalidate/route.ts`) and refreshes those pages.
- If either secret is missing, the trigger silently does nothing, so content edits never fail because of it.

It works for the admin panel, the table editor and SQL alike. **A new content table needs** its trigger (copy the pattern in `20261028150000_revalidate_webhooks.sql`) **and** a line in `tagByTable`.

Check it (responses are kept for 6 hours; times are UTC):

```sql
select status_code, content, error_msg, created
from net._http_response order by created desc limit 5;
```

`200` means the site refreshed; `401` means the Vault secret doesn't match Vercel's. To change a secret: `select id, name from vault.secrets;` then `select vault.update_secret('<id>', '<new value>');`.

Things that change with the date alone (enrollment opening, an event passing) are refreshed by the daily keep-alive job **(Unverified: site code)**.

## 9. Images (Storage)

Images are in the public Storage bucket **`media`**, uploaded by the admin panel. Anyone can download a file by URL; only admins can upload, replace, list or delete (policies on `storage.objects`). Files are at most 5 MB and must be WebP, JPEG, PNG or AVIF. SVG is blocked on purpose, because an SVG in a public bucket can carry script.

Folders follow the admin's image sections **(Admin code)**: `testimonials`, `team`, `lecturers`, `partners`, `graduates`, `events`. Tables store the full public URL (`image_url`, `photo_url`, `logo_url`, `avatar_url`). Deleting a row keeps its image in the library.

## 10. Rate limits

Two tables count recent requests by hashed email and IP, shared across all server instances. Both lock with a Postgres advisory lock so parallel requests count correctly, and delete rows older than a day on each call.

| Function | Limits per hour |
|---|---|
| `request_checkout_email_code` | 1 per minute per email or browser; 6 per email, 10 per browser, 20 per IP; **100 in total** |
| `reserve_service_request` (contact form) | 1 per minute per email or IP; 3 per email, 5 per IP; **20 in total** |

The total limits protect the email budget, but a single person can use them up and block everyone else for an hour.

## 11. Scheduled jobs

**(Unverified: site code.)** One Vercel Cron job in `vercel.json`: `GET /api/keep-alive` daily at 03:00 UTC (07:00 Tbilisi), protected by `CRON_SECRET`. It:

- queries the database, because the Free plan pauses a project after a week without activity;
- refreshes date-dependent pages;
- drains the email outbox.

There is no `pg_cron` job in the database.

## 12. Leftovers and special rows

- **Removed installment subscriptions.** An earlier design used monthly Stripe subscriptions. `20261027120000_remove_installments.sql` removed the tables, columns and functions; only manual payments remain. Old migrations still mention installments.
- **`payment_mode = 'legacy'`** marks orders from the removed one-time checkout. They have no payment attempts; their single payment is the order itself (`paid_at`).
- **Event orders.** `orders.event_id` and the constraint `orders_one_item` (a course with a plan, or an event) exist, but nothing creates event orders yet.
- **`orders.refunded_amount`** exists and the admin's order page displays it, but nothing in the database or the old site code writes it: refunds and disputes in Stripe don't reach the database **(Unverified: site code)**.
- **`course_plans.stripe_price_id`** is unused by the old site code and the admin; checkout sends prices inline **(Unverified: site code)**.
- **Imported students (2026-11-06).** 35 existing Manual QA students were imported from the company's spreadsheets as live orders: 34 `partially_paid`, 1 `pending`, minimum $100, with a course snapshot. They have no `checkout_verification_id`, no payment attempts and no payment dates (the sheets had none), so the admin shows only their totals. New payments through the site are recorded normally.

## 13. Useful SQL

Who still owes money (Live):

```sql
select cu.full_name, o.checkout_email,
  (o.amount / 100.0)::numeric(10,2) as price,
  (o.amount_paid / 100.0)::numeric(10,2) as paid,
  ((o.amount - o.amount_paid) / 100.0)::numeric(10,2) as owes,
  o.status
from orders o join customers cu on cu.id = o.customer_id
where o.stripe_livemode and o.status in ('pending', 'partially_paid')
order by owes desc;
```

A student's payments:

```sql
select a.created_at, a.status, (a.amount / 100.0)::numeric(10,2) as amount, a.paid_at,
  to_timestamp(a.checkout_expires_at) as expires
from course_payment_attempts a join orders o on o.id = a.order_id
where o.checkout_email = 'student@example.com'
order by a.created_at;
```

Emails that need attention:

```sql
select id, recipient, status, attempts, last_error, created_at
from order_emails where status <> 'sent' order by created_at desc;
```

Delete Sandbox test orders (children first, because nothing cascades):

```sql
begin;
delete from order_emails where order_id in (select id from orders where stripe_livemode = false);
delete from course_payment_attempts where order_id in (select id from orders where stripe_livemode = false);
delete from orders where stripe_livemode = false;
commit;
```

Database size (Free plan quota is 500 MB):

```sql
select pg_size_pretty(pg_database_size(current_database()));
```

## 14. Known limitations

- **No backups on the Free plan.** Take `supabase db dump` files regularly (it needs Docker and access to the project or its database password), or move to Pro.
- **Refunds and disputes** made in Stripe don't update orders **(Unverified: site code)**.
- **Old Stripe pages** stay payable until they expire (about 30 minutes), even after a price change or enrollment closing. See the procedure in section 6.
- **Unpaid orders reset to the current price** when the student checks out, so a special price can't be kept on an order with nothing paid.
- **Global rate limits** (100 codes, 20 service requests per hour) can be used up by one person.
- **Data retention.** Customers, orders and verifications are kept with no automatic deletion. Confirm the retention period with the company's lawyer or accountant, and make the privacy policy match.
- **The site's types file** is partly hand-written (section 2) **(Unverified: site code)**.
