# GenofIT admin panel: developer guide

For developers who will work on the admin panel after us. It explains how the project is built and how each part works, and where to make common changes.

Written 2026-11-06 from this repo's code at commit `dd37fcd` plus the uncommitted Orders change of that day. Everything here was read from the code, not from memory. For the database itself (tables, RLS, payment flow, Vault), read `DATABASE.md`, which lives with the site repo. Two older documents in this repo go deeper on history and decisions: `PLAN.md` (features, rules, build order) and `README.md` (setup).

## Contents

1. [What it is](#1-what-it-is)
2. [Running it](#2-running-it)
3. [Project layout](#3-project-layout)
4. [Sign-in and security](#4-sign-in-and-security)
5. [How a content section works](#5-how-a-content-section-works)
6. [Forms](#6-forms)
7. [Lists: publish and reorder](#7-lists-publish-and-reorder)
8. [Images](#8-images)
9. [Section notes](#9-section-notes)
10. [Orders and Emails](#10-orders-and-emails)
11. [How changes reach the public site](#11-how-changes-reach-the-public-site)
12. [Caching and loading](#12-caching-and-loading)
13. [Tests and checks](#13-tests-and-checks)
14. [Common changes, step by step](#14-common-changes-step-by-step)
15. [Known limitations](#15-known-limitations)

## 1. What it is

A separate Next.js app where GenofIT staff edit the public site's content (courses, services, events, testimonials, team, partners, graduates, images) and look at orders and payment emails. It talks to the **same Supabase project** as the site. It has no database of its own and **never adds migrations**: schema changes belong in the site repo's `supabase/migrations/`.

| Area            | Choice                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript strict                                   |
| Data            | `@supabase/supabase-js` + `@supabase/ssr` (the admin's login session lives in cookies) |
| Forms           | `react-hook-form` + `zod`                                                              |
| UI              | Tailwind 4, CVA, `lucide-react` icons, Radix Dialog for confirmations                  |
| Tests           | Vitest + Testing Library (jsdom)                                                       |
| Package manager | pnpm 11                                                                                |
| Hosting         | Vercel                                                                                 |

**It holds no secrets.** Every read and write uses the signed-in admin's own Supabase session, so the database's row level security decides what's allowed. There is no Stripe, Resend or service role key in this app, and it never calls the site's revalidate endpoint (the database does that, see section 11).

## 2. Running it

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev        # http://localhost:3001 (the site uses 3000)
```

Environment variables (all public, none secret):

| Variable                               | What it is                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Same as the site                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as the site                                                                                                   |
| `NEXT_PUBLIC_SITE_URL`                 | The public site (`https://www.genofit.tech`), for image previews of files in the site's own `public/images` folder |

`NEXT_PUBLIC_` values are baked in at build time, so changing one in Vercel needs a redeploy.

**Admin accounts.** Public sign-up is off. An admin needs a Supabase Auth user **and** a row in `admins`; a user without the row can't sign in, and the panel itself can't write to `admins`. Step-by-step instructions, including removing an admin: [ADD_AN_ADMIN.md](ADD_AN_ADMIN.md).

**Types.** `src/types/supabase.ts` is generated from the database. Regenerate it after every migration in the site repo:

```powershell
supabase gen types typescript --project-id <project ref> | Out-File -Encoding utf8 src/types/supabase.ts
```

Use `Out-File -Encoding utf8`; PowerShell's `>` writes UTF-16. Note: on 2026-11-06 the file was updated **by hand** (rename to `prepare_course_payment_v2`, new `checkout_expires_at` column) because the account used no longer had permission to generate types. The next real regeneration replaces those edits with the same result, plus anything else that changed.

## 3. Project layout

```text
src/
  proxy.ts                     refreshes the session cookie; sends visitors without one to /login
  app/
    layout.tsx, robots.ts      root layout; robots.txt disallows everything
    login/                     sign-in form and signIn/signOut actions
    (admin)/                   everything behind sign-in
      layout.tsx               requireAdmin() + sidebar
      page.tsx                 dashboard (points to Help)
      error.tsx, loading.tsx   error screen, loading skeleton
      courses/ services/ events/ testimonials/ team/ partners/ graduates/
      orders/ emails/          read-only
      media/                   the Images page
      help/                    the editors' manual
  components/
    forms/                     ImageField, MediaPicker, CardListEditor, stagedImages, useLeaveWarning…
    ui/                        Button, SaveBar, ConfirmDialog, ReorderableList, PendingNavigation…
  lib/
    auth.ts                    getAdminClient / requireAdmin
    supabase/                  server, browser and proxy clients
    schema.ts                  shared zod helpers (text, slug, image URL)
    children.ts                saving ordered child lists
    order.ts                   saving list order
    images.ts, media*.ts       uploads, the media library, image sections
    zoned-time.ts              event times in a venue's time zone
  types/supabase.ts            generated database types
tests/                         Vitest tests, one file per area
```

Each content section folder follows the same pattern:

| File                            | Job                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `page.tsx`                      | The list                                                                         |
| `new/page.tsx`, `[id]/page.tsx` | Create and edit pages (courses and events have one route per tab under `[id]/`)  |
| `<name>.schema.ts`              | zod schema for the form, used on both sides, plus the empty values for a new row |
| `<name>.data.ts`                | Loads one row (server only) and shapes it for the form                           |
| `actions.ts`                    | Server actions: create, save, delete, publish, save order                        |
| `_components/`                  | The form and its buttons                                                         |

## 4. Sign-in and security

Three layers, from outer to inner:

1. **`src/proxy.ts`** (Next.js middleware) refreshes the Supabase session cookie on every request and redirects anyone **without a session** to `/login`. It's a convenience only.
2. **`requireAdmin()`** (`src/lib/auth.ts`) gets a session client and calls the database function `is_admin()`. If the user isn't signed in or isn't in `admins`, it redirects to `/login`. The `(admin)/layout.tsx` calls it, and so does **the first line of every server action**, because server actions are public URLs that the layout doesn't protect. `getAdminClient` is wrapped in React `cache()`, so the layout and page share one check per request.
3. **Row level security** in the database: even if a check were missed, the admin's session can only do what the "Admins manage …" policies allow.

Sign-in (`login/actions.ts`) uses email and password. A valid Supabase user who isn't an admin is signed straight out again. Wrong email and wrong password get the same message, so the form doesn't reveal which emails exist.

Every action also validates its inputs with zod (ids with `z.uuid()`), even though the form already did.

The panel is hidden from search engines three ways: an `X-Robots-Tag: noindex, nofollow` header on every response (`next.config.ts`), a `robots.txt` that disallows everything, and no public pages besides `/login`.

**Rules if you ever add a secret** (for example a restricted Stripe key for a refund button): put it only in files that import `server-only`, start every action that uses it with `requireAdmin()`, validate inputs with zod, and never use the Supabase secret key for edits (with the admin's session, a missed check still hits RLS). See `PLAN.md`, "Secrets and security".

## 5. How a content section works

Partners is the simplest example (`src/app/(admin)/partners/`):

1. **List** (`page.tsx`): loads all rows in `sort_order`, shows Published/Draft, a Publish/Unpublish button, and an "Edit order" mode.
2. **Edit page** (`[id]/page.tsx`): `requireAdmin()`, then `loadPartner()` from `partner.data.ts`, which turns database nulls into empty strings for the form. A missing row shows Next's not-found page.
3. **Form** (`_components/PartnerForm.tsx`): `react-hook-form` with `zodResolver(partnerSchema)`. On save, staged images are uploaded first (section 8), then the action is called.
4. **Action** (`actions.ts`, `savePartner`):
   ```ts
   const db = await requireAdmin();
   const partnerId = z.uuid().parse(id);
   const parsed = partnerSchema.safeParse(input);
   if (!parsed.success) return { ok: false, error: "Check the fields." };
   const { error } = await db
     .from("partners")
     .update(toRow(parsed.data))
     .eq("id", partnerId);
   if (error) throw error;
   revalidatePath("/partners");
   ```
   `toRow()` maps form values to columns (`nullIfEmpty` stores empty optional text as `null`, so the site's fallbacks apply). Expected problems return `{ ok: false, error }` for the form to show; unexpected database errors are thrown and land on `error.tsx`.
5. **Create** puts the new row at the end (`sort_order` = last + 1) and redirects to the list.
6. **Delete** asks for confirmation (`ConfirmDialog`), then deletes. Images stay in the library. Where the database refuses a delete (a course or event with orders, error code `23503`), the action returns a readable message instead of throwing.

**Schemas mirror database checks.** For example, `partnerSchema` refuses publishing without a logo, matching the database constraint `partners_published_have_logo`. The form shows the problem next to the field before the database ever sees it. When you add a database check, add the same rule to the schema (and to the Help page).

**Child lists** (course modules, service scope items, event speakers…) are saved with `syncChildren()` (`src/lib/children.ts`). It compares the submitted list with the rows in the database: rows that disappeared are deleted, known ids are updated, everything else is inserted, and the form's order becomes `sort_order`. An id that doesn't belong to this parent is treated as new, so a forged id can't move another course's row. Removals run first, so a failure part-way can lose that save's changes but never duplicates rows. `event_agenda_items` has no `sort_order` (ordered by time).

## 6. Forms

Shared behaviour, so every form feels the same:

- **`SaveBar`** (`components/ui/SaveBar.tsx`): sticky footer with Save, the result message, an "Unsaved changes" hint, and "Discard changes" on edit forms or a Cancel link on create forms.
- **Leave warning** (`components/forms/useLeaveWarning.ts`): with unsaved changes, closing or reloading the tab shows the browser's own warning, and clicking a link inside the admin asks first. The browser's Back button isn't covered.
- **Field helpers** in `components/forms/`: `ImageField` and `MediaPicker` (section 8), `CardListEditor` (title + description cards), `TagListEditor`, `HeadingInput`, `SearchResultsFields` (SEO title and description, with the roughly 60 and 160 characters Google shows before cutting off), `ContentBlock`.
- **Shared zod helpers** (`lib/schema.ts`): `text(max)`, `required(max)`, `slugSchema` (lowercase, numbers, single hyphens, no slashes), `imageUrlSchema` (an upload in the `media` bucket or a path under the site's `/images/`), `cardSchema`.
- **Money** is typed in dollars and stored in cents (`toCents` in the course and event actions).
- **Course and event tabs** are separate routes, each with its own form and save. Switching tabs with unsaved changes triggers the leave warning.

## 7. Lists: publish and reorder

- **Publish/Unpublish** buttons post a small form to `set…Published` actions (`toggleSchema` checks the id and value). A database check can still refuse (for example a graduate without a photo); the list only offers Publish when the row qualifies.
- **Edit order** mode: arrows move rows on screen only; "Save order" sends the full list of ids to `save…Order`. `orderChanges()` (`lib/order.ts`) renumbers 1..n and writes only changed rows. If rows were added or removed since the list was opened, it refuses with "The list changed since you opened it", so a stale order is never saved.
- **Testimonials** have one order per site page: `home_sort_order`, `academy_sort_order`, and `sort_order` for their own course or service page (Testimonials, then "Order on site").

## 8. Images

Uploads go **straight from the browser to Supabase Storage** (bucket `media`) with the admin's session; Storage policies allow only admins to upload. Nothing passes through the Next.js server.

- **Rules** (`lib/images.ts`): JPEG, PNG or WebP, up to 5 MB (the bucket enforces the same limit). Files are uploaded as they are, without resizing; the site's `next/image` makes the sized copies.
- **File names**: the original name made URL-safe, plus a random 6-character suffix, for example `team/alex-rivera-3f9a1c.jpg`. Two "photo.jpg" uploads never overwrite each other, and a replaced image never serves a stale cached copy (`cacheControl` is one year).
- **Staging** (`components/forms/stagedImages.ts`): picking a file in a form doesn't upload it. It waits in the form state under `<field>_file` (which also marks the form dirty and moves with its row when a list is reordered). On Save, staged files are uploaded first, their URLs written into the values, then the action runs. If an upload fails, the ones already uploaded are removed. If the save itself fails, `discardUploads()` removes the new files, but only if nothing uses them.
- **Removing an image from a field never deletes the file.** Unused files are cleaned up on the Images page.
- **Previews** (`lib/imagePreview.ts`): uploads are full URLs; older images are paths on the public site, shown via `NEXT_PUBLIC_SITE_URL`.

**The Images page** (`media/`):

- One tab per entry in `mediaSections` (`lib/media-sections.ts`): Testimonials, Team, Lecturers, Partners, Graduates, Events. Each key is also the bucket folder its uploads go to, and has a recommended size the forms show too.
- A tab shows the images that section's rows use, plus files uploaded to its folder that nothing uses yet ("Not used yet"). A file from another folder shows "From <section>".
- Which columns hold images, and how to label and link each usage, is listed in `mediaColumns` (`lib/media.ts`). **Add new image columns there.**
- Drag and drop uploads in bulk with the same rules as the forms.
- "Unused" lists every file nothing references, with select-and-delete (`deleteUnusedMedia`, which re-checks usage before deleting). "Other" lists files in folders that aren't sections.
- Search covers the whole library, and the grid is paginated (`MEDIA_PAGE` in `media-sections.ts`, 48 per page).

## 9. Section notes

- **Courses**: tabs Basics, Lecturers, page sections (overview, curriculum, outcomes, capstone; one route `[section]`), Stats, Pricing, SEO.
  - **Pricing** saves the course's dates and enrollment switch, then upserts its single `course_plans` row (`onConflict: course_id`): tuition, "pay in parts" switch, minimum payment, price card text.
  - `course_plans.is_active` isn't in the form on purpose: unpublishing or switching enrollment off already stops checkout.
  - `EnrollmentBadge` shows the enrollment state using the same rules as the site.
  - Deleting a course with orders is refused.
  - A delete trigger unpublishes and unlinks its testimonials.
  - Lecturer LinkedIn is optional.
- **Events**: tabs Basics, Schedule, Highlights, Agenda, Speakers.
  - Times are entered as the venue's local date and time plus a time zone, and converted to exact moments with `lib/zoned-time.ts` (Intl, daylight-saving aware).
  - `scheduleSchema` mirrors the database checks (registration window, a published event needs an opening date, valid time zone, end after start).
  - The agenda holds times on the event's start date (one-day events).
  - The site doesn't take event registrations yet; registration dates are only shown.
- **Services**: one form with three card lists (scope, use cases, deliverables). Deleting a service unpublishes and unlinks its testimonials (a database trigger).
- **Testimonials**: graduate or client type, linked to a course or service, placed on Home and/or Academy, with a preview (`TestimonialPreview`) and per-page ordering.
- **Team, Partners, Graduates**: single forms. A published partner needs a logo, a published graduate a photo.
- **Help** (`help/page.tsx`): a hand-written manual for editors, explaining every section, field rule and the order-related procedures (for example how to change a price safely). **Update it whenever a form rule or behaviour changes**; nothing updates it automatically.

## 10. Orders and Emails

Both are **read-only**: the panel can't change orders or emails (admins only have read access in the database).

**Orders** (`orders/page.tsx`, helpers in `order.helpers.ts`):

- Sandbox and Live tabs (`stripe_livemode`), never mixed.
- Status filters (`statusFilters`):
  - Owes money (default, `partially_paid`)
  - Paid
  - Checkout not finished (`pending`)
  - Closed (`failed`, `canceled`, `refunded`)
  - All
- Search by customer name or email. 50 per page.
- Columns:
  - **Started:** first payment, or when checkout was opened.
  - **Payments:** the latest three paid attempts with amounts, then "+N more".
  - Paid out of total, and Balance.
- Sorted by latest activity by default (`activity_at`, a generated database column). The Started and Payments headers toggle newest or oldest first (`orderSorts`, `nextSort`). The choice is kept in the URL (`?sort=&dir=`, defaults left out), and `id` breaks ties so pages don't overlap.
- The order page (`orders/[id]`) has:
  - the course as its title
  - payment summary with Stripe links
  - customer details
  - every payment attempt (Paid, In progress, Not completed)
  - the order's emails
- All times are UTC and labelled so (Tbilisi is UTC+4).

**Emails** (`emails/page.tsx`):

- Lists `order_emails` across orders, per Sandbox or Live.
- Filters:
  - Problems (default: stopped retrying, or failed at least once)
  - Not sent yet
  - Stopped retrying
  - Sent
  - All
- Recipient search.
- Shows which email it is: payment 1 is the course welcome, anything else a receipt. Wording is shared with the order page (`emailStatusText`, `emailKind`).
- **No resend button, on purpose.** Failed sends retry by themselves, and "Stopped retrying" ones need a manual check in Resend first (see `DATABASE.md`, payment emails).

Students imported from spreadsheets on 2026-11-06 have no payment attempts or payment dates, so their orders show only totals and today's date as Started.

## 11. How changes reach the public site

The panel does nothing special. A trigger on every content table in the database calls the site's `/api/revalidate` after each change, so the site refreshes that content within seconds. It works the same for edits made in the Supabase table editor or SQL. Setup and checks are in `DATABASE.md` (site refresh). If a change doesn't appear on the site, check `net._http_response` there first.

Images are served by URL and need no refresh.

## 12. Caching and loading

- Admin pages render fresh on every request (they read cookies), so there's no server cache.
- **Browser cache of 30 seconds** (`staleTimes.dynamic` in `next.config.ts`, an experimental Next option): going back to a recently visited page is instant. Every save action calls `revalidatePath`, which clears it, so an admin always sees their own edits. Changes made elsewhere (a new order, another admin) can appear up to 30 seconds late; reloading shows them.
- `loading.tsx` files show skeletons (`PageSkeleton`) while a page loads. `PendingNavigation`, `PendingLink` and `StableLabel` show which link or tab is loading without the layout jumping.

## 13. Tests and checks

```powershell
pnpm typecheck
pnpm lint
pnpm test          # Vitest, 93 tests on 2026-11-06
pnpm build
```

- Tests are in `tests/`, one file per area: schemas and actions' pure helpers (courses, events, services, team, partners, graduates, testimonials), login, images and staging, media search and sections, orders helpers, zoned time.
- Component tests use jsdom, which needs Node 22.19 or newer.
- They don't touch a database. Database behaviour is tested in the site repo (`tests/database/*.sql`).
- There is no CI workflow in this repo; run the checks before pushing.

## 14. Common changes, step by step

**A new field on an existing form** (for example a subtitle on partners):

1. Add the column in a migration in the **site** repo and apply it.
2. Regenerate `src/types/supabase.ts` here.
3. Add the field to `<name>.schema.ts` (and its empty value), `<name>.data.ts` (select and map), `toRow()` in `actions.ts`, and the form component.
4. If the site shows it, the site needs the change too.
5. Update the Help page.

**A new content section** (a new table):

1. In the site repo: the table, grants, RLS policies (public read when published, admin manage) and the revalidate trigger, plus a line in the site's `tagByTable`. See `DATABASE.md`.
2. Here: copy the partners folder as a starting point, add the sidebar entry in `(admin)/layout.tsx`, and tests.
3. If it has images: a folder in `mediaSections` and an entry in `mediaColumns`.
4. Update the Help page.

**A new database rule** (check constraint): mirror it in the zod schema so the form explains it, and add it to the Help page.

**Changing order or email screens**: keep wording in `order.helpers.ts` so the list and the order page stay consistent, and add tests in `tests/orders.test.ts`.

## 15. Known limitations

- **Saves aren't all-or-nothing.** A row and its child lists are saved in separate requests (supabase-js has no transactions). A failure part-way can lose that save's changes but never duplicates rows.
- **No editing of orders or emails.** Status fixes (for example after a refund) are done in the Supabase SQL editor. A future version could add guarded database functions with a confirm step (see `PLAN.md`, "Later").
- **Refunds and disputes** in Stripe don't update orders.
- **Up to 30 seconds** before changes made elsewhere show on a recently visited page.
- **The Help page is hand-written** and can drift from the code.
- **Times**: order and email times are UTC; the Unused images list uses the viewer's own time.
- **Types** may contain the hand edits from 2026-11-06 until someone with permission regenerates them.
