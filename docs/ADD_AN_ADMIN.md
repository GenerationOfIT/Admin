# Adding an admin

How to give someone access to the GenofIT admin panel, step by step. It takes about two minutes and needs access to the GenofIT project in the Supabase dashboard.

Nobody can sign up on their own: an admin needs **two things**, a Supabase user account (their email and password) and a row in the `admins` list. Someone with only the first can't sign in to the panel.

## 1. Create their account

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and choose the GenofIT project.
2. In the left menu, click **Authentication**, then **Users**.
3. Click **Add user** (top right), then **Create new user**.
4. Fill in:
   - **Email:** their work email.
   - **Password:** a strong password. Send it to them privately (not in a group chat or email thread others can read).
   - Tick **Auto Confirm User**. Without it, the account waits for an email confirmation and can't sign in.
5. Click **Create user**. They now appear in the list of users.

## 2. Make them an admin

1. In the left menu, click **SQL Editor**, then **New query**.
2. Paste this, with their email in place of `admin@example.com` (keep the quotes):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'admin@example.com';
   ```
3. Click **Run**. You should see "Success. 1 row" (or "INSERT 0 1").
   - **"0 rows"** means no account has that email. Check the spelling against the Users list (step 1); emails are stored in lowercase.
   - **"duplicate key"** means they're already an admin.

## 3. Check it worked

Run this in the SQL Editor:

```sql
select email, created_at from public.admins order by created_at;
```

Their email should be in the list. Then ask them to sign in at the admin panel's address with their email and password. They should land on the Dashboard.

If they see **"This account doesn't have admin access"**, step 2 is missing or used a different email. If they see **"Email or password is incorrect"**, check the password, or that **Auto Confirm User** was ticked (step 1).

## Removing an admin

To take away panel access, run (with their email):

```sql
delete from public.admins where email = 'admin@example.com';
```

They lose access on their next click in the panel, even if they're signed in right now.

To also delete their account completely: **Authentication**, **Users**, find them, open the **⋮** menu on their row, and choose **Delete user**. Remove them from `admins` first, as above.

## Changing a password

The panel has no "Forgot password" link. To give someone a new password: **Authentication**, **Users**, click their row, and use the option to update the password there, or delete the account and create it again (steps 1 and 2).

## Good to know

- **Every admin can edit all website content and see all orders and customer details.** There are no lighter roles, so only add people who need that.
- Admins can't add other admins from inside the panel; it's always done here.
- Public sign-up is switched off in Supabase on purpose. Keep it that way, or anyone could create an account (they still couldn't use the panel without step 2, but there's no reason to allow it).
