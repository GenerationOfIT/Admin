# GenofIT Admin Panel: plan

Admin panel for the GenofIT site (repo `Sandroo10/GenOfIT`). Admins edit the site's content in Supabase and view orders. Background and reasoning: `ADMIN_PANEL_DECISIONS.md` and `SUPABASE_PLAN.md` ("Admin panel" section) in the GenOfIT repo.

## Stack

Same as the GenOfIT site, so both repos work the same way.

| Area            | Choice                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router, React 19, TypeScript strict                                 |
| Package manager | pnpm 11                                                                            |
| Styling         | Tailwind 4, CVA for real variants, `clsx` + `tailwind-merge`, `lucide-react` icons |
| Supabase        | `@supabase/supabase-js` + `@supabase/ssr` (login session in cookies)               |
| Forms           | `react-hook-form` + `zod`                                                          |
| UI primitives   | Radix (Dialog for confirmations, more only when needed)                            |
| Tests           | Vitest + Testing Library, Playwright for e2e                                       |
| Lint/format     | ESLint (`eslint-config-next`), Prettier + Tailwind plugin                          |
| Hosting         | Vercel                                                                             |

**Copy from GenOfIT:** `eslint.config.mjs`, `prettier.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.mts`, `playwright.config.ts`, and `.gitignore`. Adjust paths and settings as needed. Use the same versions as GenOfIT's `package.json`.

**Not needed:** Stripe, Embla, SEO helpers, JSON-LD, Open Graph.

## Architecture

Follow GenOfIT's `FRONTEND.template.md`, with these exceptions:

- **SEO Standard:** skip it, except for the opposite rule. The whole panel is hidden from search engines: `robots: { index: false, follow: false }` in the root metadata, and a `robots.txt` that disallows everything.
- **i18n and Home Rule:** don't apply.
- **Auth Pattern:** login is one feature folder, as the template says.

Routes:

```text
src/app/
  login/                      email + password
  (admin)/                    everything behind login
    layout.tsx                checks the session, redirects to /login
    courses/  [id]/           one tab per route: basics, lecturers, sections, stats, pricing, seo
    services/ [id]/
    events/   [id]/           tabs: basics, schedule, highlights, agenda, speakers
    team/     [id]/
    partners/ [id]/           home page logo strip
    graduates/ [id]/          Graduates and About page carousel
    testimonials/ [id]/ order/
    orders/   [id]/
    emails/
    media/                    Images: tabs per section, bulk upload, Unused
    help/                     editors' manual
```

## Database

- **Schema owner:** the GenOfIT repo. This repo never adds migrations; schema changes go in GenOfIT's `supabase/migrations/`.
- **Types:** generate them, don't copy them (`README.md` has the details):
  ```powershell
  supabase gen types typescript --project-id <project ref> | Out-File -Encoding utf8 src/types/supabase.ts
  ```
  Re-run after every GenOfIT migration.
- **Access** (RLS, already in the database):

  | Tables                                                                                                                          | Admin can                           |
  | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
  | courses and `course_*`, services and `service_*`, events and `event_*`, `team_members`, `testimonials`, `partners`, `graduates` | read, insert, update, delete        |
  | `customers`, `orders`, `course_payment_attempts`, `order_emails`, `admins`                                                      | read only                           |
  | `checkout_email_verifications`                                                                                                  | nothing (server only)               |
  | storage bucket `media`                                                                                                          | upload, update, delete; public read |

## Login and admins

- **Login:** Supabase Auth, email and password. Public sign-up is off in the Supabase dashboard.
- **Adding an admin:** invite them from the Supabase dashboard (Authentication > Users), then add a row to `admins` (`user_id`, `email`) in the SQL editor. The panel can't write to `admins`.
- **Layout check:** `(admin)/layout.tsx` redirects anyone not logged in, or not in `admins` (`rpc("is_admin")`), to `/login`.

## Secrets and security

**No secrets.** Every read and write uses the logged-in admin's session, so RLS decides. Env vars are all public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` (the public site, for "View on site" links and image previews).

Rules:

1. Never use the Supabase secret key for edits. With the admin's session, a missed check still hits RLS.
2. Server actions and route handlers are public URLs. The layout redirect doesn't protect them.
3. Don't rely on `proxy.ts` alone for auth.
4. If a secret is ever added (refund button: restricted Stripe key; email retry: `CRON_SECRET`):
   - put it only in a file that imports `server-only`
   - every action that uses it starts with a shared `requireAdmin()` (logged in + `is_admin()`)
   - validate the inputs with zod
5. Don't pass whole rows or config objects to client components when only a few fields are needed.

## Refreshing the public site

The site caches content until `/api/revalidate` is called. A database trigger on every content table calls it after each change (GenOfIT migration `20261028150000_revalidate_webhooks.sql`), so the panel never calls it and holds no secret. It also covers edits made in the Supabase table editor or SQL.

- The endpoint URL and `REVALIDATE_SECRET` are stored once in Supabase Vault, not in git. Setup and a check query are in GenOfIT's `supabase/README.md`.
- Until they're stored, the trigger does nothing and the site only refreshes on a redeploy.
- Fire-and-forget: no retries. A failed call shows in `net._http_response` for 6 hours.

## Features

### Content

For courses, services, events, team members, testimonials, partners and graduates:

- list in `sort_order`, with published/draft status and Publish/Unpublish buttons
- create, edit, delete with a confirmation dialog; deleting a service or course unpublishes and unlinks its testimonials, and a course with orders can't be deleted
- reorder lists in an "Edit order" mode: arrows move rows on screen only, then "Save order" saves the whole order in one action (`orderChanges` in `src/lib/order.ts`), refusing if the list changed meanwhile. Child lists (modules, outcomes, scope items...) are reordered inside their forms
- testimonials have one order per site page: `home_sort_order`, `academy_sort_order`, and `sort_order` for their own service or course page (Testimonials → Order on site)
- courses also have the enrollment switch and dates, and the `full` plan's `amount` (tuition), `manual_payments_enabled` and `minimum_payment`. `course_plans.is_active` isn't in the form on purpose: unpublishing the course or switching enrollment off already stops checkout. Stripe Price IDs and `installments` plans are no longer used
- images: JPEG, PNG or WebP up to 5 MB, uploaded as is (no resizing) with a recommended size shown per field. A picked file is staged in the form and uploaded only on Save, under a new name (`<name>-<6 hex>.<ext>`), and removed again if the save fails. Removing an image from a field never deletes the file
- Images page (`media/`), WordPress-style: one tab per section in `mediaSections` (`src/lib/media-sections.ts`), each with a drag-and-drop zone that bulk-uploads into that section's folder with the forms' rules, then a grid. A tab shows images that section uses (from `mediaColumns` in `src/lib/media.ts`, which also names and links each usage) plus unused files uploaded to it ("Not used yet"); a file uploaded elsewhere shows "From <section>". Unused lists everything nothing uses, with select-and-delete; Other (always shown) lists files in folders that aren't sections, used or not, e.g. put straight into storage. The forms' "Choose existing" opens on the form's section. Uploading here means a file is unused until a form picks it; that's expected
- the Help page (`help/`) explains every section and its rules for editors; update it whenever a form rule changes

Placeholder-copy note: all site text is placeholder until the company sends final copy, so editing must be easy.

### Events

Built 2026-10-31, after first being deferred. Tabs:

- **Basics:** title, slug, card text, introduction, photo (`image_url`, required to publish), price (dollars in the form, cents in `events.price`; 0 = free), publish, delete (refused while `orders.event_id` points at it; highlights, agenda and speakers cascade).
- **Schedule:** start and optional end as the venue's local date and time plus `timezone`, converted to `starts_at`/`ends_at` with `src/lib/zoned-time.ts` (Intl, daylight-saving aware); location and the optional address parts for JSON-LD; registration switch and dates. One tab because the registration rules depend on the day and time zone. `scheduleSchema` mirrors the database checks (`events_registration_window_valid`, `events_published_need_registration`, `events_timezone_valid`, end after start).
- **Highlights:** icon from the six in the `event_highlights` check, label, ordered.
- **Agenda:** title plus items stored as `starts_at` on the event's start date at the venue (times of day only; one-day events). `event_agenda_items` has no `sort_order`, so `syncChildren` skips it there; items load sorted by time.
- **Speakers:** name, job title, company, photo (`events` folder), ordered. `photo_alt` and `image_alt` aren't edited: the site shows the event photo as decoration and names speakers itself.

The list's registration badge uses `registrationStatus`, the same rules as the site's `toRegistration`. Registration dates are still only enforced in the site's UI; no endpoint takes event registrations, so one added later must check the window on the server, like course checkout.

### Orders (read-only)

Two payment models exist (GenOfIT migration `20261026150000`, `docs/manual-course-payments.md`):

- **`payment_mode = 'manual'`** (all new buyers): pay any amount from `course_plans.minimum_payment` up to the balance, as separate one-time payments. Show:
  - `amount` (tuition), `amount_paid`, balance (`amount - amount_paid`)
  - `successful_payment_count`, `status` (`partially_paid` until fully paid)
  - the `course_payment_attempts` ledger
- **`payment_mode = 'legacy'`**: only old sandbox full-payment test orders. Installments were removed entirely (GenOfIT migration `20261027120000`).

Common to both:

- **List:** Started (`first_paid_at`, else `created_at`), customer, course, Payments (the latest 3 paid `course_payment_attempts` with amounts, then "+N more"; legacy orders show `paid_at`), amount, status. Sorted by `activity_at` (`coalesce(last_paid_at, created_at)`, GenOfIT migration `20261104120000`). Filter sandbox vs live with `stripe_livemode`. The whole row opens the order.
- **"Owes money" filter:** `status = 'partially_paid'`.
- **"Checkout not finished":** the label for `status = 'pending'`. Checkout creates the order before the Stripe page opens and reuses it when the customer returns, so it means "started, nothing paid yet". On return, an order with nothing paid and no open checkout takes the current price, minimum and `created_at = now()`; once anything is paid its terms are fixed. Expired checkouts leave it pending; nothing today sets `failed`, `canceled` or `refunded` (only the old one-time checkout did).
- **Paid but not updated:** if saving a payment failed, Stripe retries the event (up to 3 days in live) and it can be resent from Stripe's Event deliveries. Replaying is safe; don't change order fields by hand. The Help page explains this to editors.
- **No automatic reminders** for manual balances. Chasing them is manual.
- **Course plans editor:** `manual_payments_enabled` and `minimum_payment` (default $100, a placeholder) on the `full` plan.
- **Detail page:**
  - customer contact details
  - its payment attempts (`course_payment_attempts`)
  - "Open in Stripe" links, built from each attempt's `stripe_payment_intent_id`
- **Refunds and disputes:** done in the Stripe Dashboard. They don't update `orders` yet, and admins can't write to `orders`, so a status fix is done in the Supabase SQL editor for now.

### Emails (read-only)

- `emails/` lists `order_emails` across orders, filtered by the order's `stripe_livemode`. Default filter "Problems": `review`, or `pending`/`sending` with at least one failed attempt. Also Not sent yet, Stopped retrying, Sent, All, and recipient search. Rows open the order.
- Shows which email it is (from `payload->paymentNumber`: 1 = course welcome, anything else = receipt, the same rule as the site's `paymentEmail` template), status, earliest retry, last error. Wording is shared with the order page (`emailStatusText`, `emailKind` in `orders/order.helpers.ts`).
- No resend button on purpose: failed sends retry on their own, and `review` rows need a manual check in Resend before anything is resent (see GenOfIT `docs/checkout-email.md`).

### Later

- refund and dispute status on `orders`: best handled automatically from Stripe webhooks (a GenOfIT change)
- guarded admin actions, each a GenOfIT database function with a confirm step, a note and who/when: email "Stopped retrying" → Sent or send again; order → Canceled or Refunded. Not free editing of status fields, which would drift from Stripe and the payment ledger
- refund button (restricted Stripe key, decide which admins may refund)

## Known limitations

- **Saves aren't all-or-nothing.** A row and its card lists are saved in separate steps (supabase-js has no transactions). Removals run first, so a failure part-way can lose that save's changes but never duplicates rows.
- **Browser cache of 30 seconds** (`staleTimes.dynamic` in `next.config.ts`, an experimental Next option). Revisiting a page within 30 seconds is instant; every save action calls `revalidatePath`, which clears it, but changes made elsewhere (new orders, another admin) can show up to 30 seconds late on a recently visited page.
- **Times are in UTC.** Order and email times are formatted on the server in UTC and labelled "UTC" (Tbilisi is UTC+4); the Orders list header says "Date (UTC)". Unused images dates are formatted in the browser, so they use the viewer's own time.
- **The Help page is hand-written.** It doesn't update itself when a form rule changes.

## Build order

All done:

1. Scaffold: Next.js app, copied configs, Tailwind, ESLint/Prettier, Vitest, Playwright. Generate types.
2. Login, `(admin)` layout check, noindex.
3. Services, the simplest content, to settle the patterns for list, edit, children, reorder and publish.
4. Courses, team, testimonials, reusing those patterns. Events followed later (see "Events" above).
5. Image upload.
6. Orders and emails views.
7. Supabase webhooks for revalidation, tested live on 2026-10-28.
8. Loading states, per-page testimonial order, the Edit order mode, and the Help page.
