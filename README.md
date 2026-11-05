# GenofIT Admin Panel

Admin panel for the GenofIT site: edit the site's content in Supabase and view orders. The plan, access rules and build order are in [PLAN.md](PLAN.md).

## Setup

```powershell
pnpm install
Copy-Item .env.example .env.local   # fill in the same values as the GenofIT site
pnpm dev                            # http://localhost:3001
```

The site runs on port 3000, so the panel uses 3001.

## Admin accounts

Public sign-up is off. To add an admin:

1. Supabase dashboard > Authentication > Users > Add user > Create new user, with email, password and "Auto Confirm User".
2. In the SQL editor:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'admin@example.com';
   ```

A Supabase user who isn't in `admins` can't sign in to the panel.

## Database types

The schema belongs to the GenofIT repo. After each migration there, regenerate the types:

```powershell
supabase gen types typescript --project-id <project ref> | Out-File -Encoding utf8 src/types/supabase.ts
```

`Out-File -Encoding utf8` matters: PowerShell's `>` writes UTF-16. The project ref is the subdomain in `NEXT_PUBLIC_SUPABASE_URL`. Never edit the file by hand; regenerate it.

## Checks

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tests run in Node. Component tests need jsdom, which needs Node 22.19 or newer.
